import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";

describe("compileSchema : reduceNode", () => {
    describe("behaviour", () => {});

    it("should return schema for boolean schema true", () => {
        // @ts-expect-error boolean schema still untyped
        const node = compileSchema(true);

        const schema = node.reduceNode(123)?.node?.schema;

        assert.deepEqual(schema, { type: "number" });
    });

    it("should compile schema with current data", () => {
        const node = compileSchema({
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            }
        });

        const dataNode = node.reduceNode({ withHeader: true });

        assert.deepEqual(dataNode?.node?.schema, {
            type: "object",
            required: ["header"],
            properties: { header: { type: "string", minLength: 1 } }
        });
    });

    it("should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema({
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            },
            allOf: [{ required: ["date"], properties: { date: { type: "string", format: "date" } } }]
        });

        const schema = node.reduceNode({ withHeader: true, header: "huhu" })?.node?.schema;

        assert.deepEqual(schema, {
            type: "object",
            required: ["date", "header"],
            properties: {
                header: { type: "string", minLength: 1 },
                date: { type: "string", format: "date" }
            }
        });
    });

    describe("object - merge all reduced dynamic schema", () => {
        it("should reduce patternProperties and allOf", () => {
            const node = compileSchema({
                allOf: [{ properties: { "107": { type: "string", maxLength: 99 } } }],
                patternProperties: { "[0-1][0-1]7": { type: "string", minLength: 1 } }
            });

            const schema = node.reduceNode({ "107": undefined })?.node?.schema;

            assert.deepEqual(schema, { properties: { "107": { type: "string", minLength: 1, maxLength: 99 } } });
        });
    });

    describe("dependencies", () => {
        it("should correctly merge dependencies", () => {
            const node: any = compileSchema({
                $ref: "#/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" }, two: { type: "string" } },
                        dependencies: { one: ["two"], two: { $ref: "#/$defs/two" } }
                    },
                    two: { required: ["three"], properties: { three: { type: "number" } } }
                }
            });
            const { node: reduced } = node.reduceNode({ one: "" });
            assert.deepEqual(reduced.schema, {
                type: "object",
                required: ["one", "two", "three"],
                properties: { one: { type: "string" }, two: { type: "string" }, three: { type: "number" } }
            });
            assert.deepEqual(reduced.dynamicId, "#/$defs/schema(dependencies/one,dependencies/two)");
        });

        it("should add required-property from dependency", () => {
            const node: any = compileSchema({
                type: "object",
                properties: { one: { title: "Property One", type: "string" } },
                dependencies: { one: { required: ["two"], properties: { two: { type: "string" } } } }
            });
            const { node: reduced } = node.reduceNode({ one: "" });
            assert.deepEqual(reduced.schema.required, ["two"]);
        });

        it("should NOT merge dependency when it is not defined", () => {
            const node: any = compileSchema({
                type: "object",
                properties: { one: { type: "string" } },
                dependencies: { one: ["two"], two: { type: "number" } }
            });
            const { node: reduced } = node.reduceNode({});
            assert.deepEqual(reduced.schema, {
                type: "object",
                properties: { one: { type: "string" } }
            });
            assert.deepEqual(node.dynamicId, "");
        });

        it("should NOT add dynamic schema if no data matches dependency", () => {
            const { node } = compileSchema({
                $ref: "#/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: [],
                        properties: { one: { type: "string" }, two: { type: "string" } },
                        dependencies: { one: ["two"] }
                    }
                }
            }).reduceNode({});
            assert.deepEqual(node.schema, {
                type: "object",
                required: [],
                properties: { one: { type: "string" }, two: { type: "string" } }
            });
            assert.deepEqual(node.dynamicId, "");
        });

        it("should resolve nested dependencies schema", () => {
            const { node } = compileSchema({
                $ref: "#/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" }, two: { type: "string" } },
                        dependencies: { one: ["two"], two: { $ref: "/$defs/two" } }
                    },
                    two: {
                        required: ["three"],
                        properties: { three: { type: "number" } },
                        dependencies: { two: { properties: { four: { type: "boolean" } } } }
                    }
                }
            }).reduceNode({ one: "" });

            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one", "two", "three"],
                properties: {
                    one: { type: "string" },
                    two: { type: "string" },
                    three: { type: "number" },
                    four: { type: "boolean" }
                }
            });
            assert.deepEqual(
                node.dynamicId,
                "#/$defs/two(dependencies/two)+#/$defs/schema(dependencies/one,#/$defs/two(dependencies/two))"
            );
        });
    });

    describe("if-then-else", () => {
        it("should select if-then-else schema", () => {
            const { node } = compileSchema({
                $ref: "#/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" } },
                        if: { minProperties: 1 },
                        then: { $ref: "/$defs/then" }
                    },
                    then: { required: ["two"], properties: { two: { type: "string" } } }
                }
            }).reduceNode({ one: "" });
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one", "two"],
                properties: { one: { type: "string" }, two: { type: "string" } }
            });
        });

        it("should resolve nested if-then-else schema", () => {
            const { node } = compileSchema({
                $ref: "#/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" } },
                        if: { minProperties: 1 },
                        then: { $ref: "/$defs/then" }
                    },
                    then: {
                        if: { minProperties: 1 },
                        then: { required: ["two"], properties: { two: { type: "string" } } }
                    }
                }
            }).reduceNode({ one: "" });
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one", "two"],
                properties: {
                    one: { type: "string" },
                    two: { type: "string" }
                }
            });
        });
    });

    describe("allOf", () => {
        it("should return merged allOf schema", () => {
            const { node } = compileSchema({
                $ref: "/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" } },
                        allOf: [{ $ref: "/$defs/one" }, { $ref: "/$defs/two" }]
                    },
                    one: { required: ["one"] },
                    two: { required: ["two"], properties: { two: { type: "number" } } }
                }
            }).reduceNode({});
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one", "two"],
                properties: {
                    one: { type: "string" },
                    two: { type: "number" }
                }
            });
        });

        it("should return undefined if allOf is empty", () => {
            const { node } = compileSchema({
                type: "object",
                required: ["one"],
                properties: { one: { type: "string" } },
                allOf: []
            }).reduceNode({});
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one"],
                properties: { one: { type: "string" } }
            });
        });

        it("should resolve nested allOf schema", () => {
            const { node } = compileSchema({
                $ref: "/$defs/schema",
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: { one: { type: "string" } },
                        allOf: [{ $ref: "/$defs/one" }, { $ref: "/$defs/two" }]
                    },
                    one: { required: ["one"] },
                    two: { required: ["two"], allOf: [{ properties: { two: { type: "number" } } }] }
                }
            }).reduceNode({});
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["one", "two"],
                properties: { one: { type: "string" }, two: { type: "number" } }
            });
        });
    });

    describe("oneOf", () => {
        it("should select oneOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                oneOf: [{ properties: { one: { type: "number" } } }, { properties: { two: { type: "string" } } }]
            }).reduceNode({ one: "string" });
            assert.deepEqual(node.schema, { type: "object", properties: { two: { type: "string" } } });
        });

        it("should select correct oneOf schema from oneOfProperty", () => {
            const { node } = compileSchema({
                type: "object",
                oneOfProperty: "id",
                oneOf: [
                    { properties: { id: { const: "first" }, one: { type: "number" } } },
                    { properties: { id: { const: "second" }, one: { type: "number" } } }
                ]
            }).reduceNode({ id: "second" });
            assert.deepEqual(node.schema, {
                type: "object",
                oneOfProperty: "id",
                properties: { id: { const: "second" }, one: { type: "number" } }
            });
        });
    });

    describe("anyOf", () => {
        it("should NOT add anyOf schema if no sub.schema matches input data", () => {
            const { node } = compileSchema({
                type: "object",
                anyOf: [{ properties: { id: { const: "first" } } }]
            }).reduceNode({ id: "second" });

            assert.deepEqual(node.schema, { type: "object" });
        });

        it("should return matching oneOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                anyOf: [{ properties: { id: { const: "second" } } }]
            }).reduceNode({ data: { id: "second" } });
            assert.deepEqual(node.schema, { type: "object", properties: { id: { const: "second" } } });
        });

        it("should return all matching oneOf schema as merged schema", () => {
            const { node } = compileSchema({
                type: "object",
                anyOf: [
                    { properties: { id: { const: "second" } } },
                    { properties: { id: { minLength: 4 } } },
                    { properties: { id: { maxLength: 4 } } }
                ]
            }).reduceNode({ id: "second" });

            assert.deepEqual(node.schema, { type: "object", properties: { id: { const: "second", minLength: 4 } } });
        });

        it("should correctly reduce multiple prefixItems", () => {
            const { node } = compileSchema({
                prefixItems: [{ const: "foo" }],
                anyOf: [{ prefixItems: [true, { const: "bar" }] }, { prefixItems: [true, true, { const: "baz" }] }]
            }).reduceNode(["foo", "bar"]);

            assert.deepEqual(node.schema, { prefixItems: [true, true, { const: "baz" }] });
        });
    });

    describe("allOf", () => {
        it("should return merged schema of type string", () => {
            const { node } = compileSchema({
                type: "string",
                allOf: [{ minLength: 10 }, { pattern: /a-.*/ }]
            }).reduceNode("a-value");
            assert.deepEqual(node.schema, {
                type: "string",
                minLength: 10,
                pattern: /a-.*/
            });
        });

        it("should return merged schema while resolving $ref", () => {
            const { node } = compileSchema({
                type: "string",
                allOf: [{ $ref: "/$defs/min" }, { $ref: "/$defs/pattern" }],
                $defs: {
                    min: { minLength: 10 },
                    pattern: { format: "html" }
                }
            }).reduceNode("a-value");
            assert.deepEqual(node.schema, {
                type: "string",
                minLength: 10,
                format: "html"
            });
        });

        it("should return merged properties and attributes", () => {
            const { node } = compileSchema({
                type: "object",
                properties: {
                    trigger: { type: "boolean" }
                },
                allOf: [
                    {
                        properties: {
                            title: { type: "string" }
                        }
                    },
                    {
                        minProperties: 2,
                        properties: {
                            time: { type: "number" }
                        }
                    }
                ]
            }).reduceNode("a-value");
            assert.deepEqual(node.schema, {
                type: "object",
                minProperties: 2,
                properties: {
                    trigger: { type: "boolean" },
                    title: { type: "string" },
                    time: { type: "number" }
                }
            });
        });

        it("should return merged required-list of type object", () => {
            const { node } = compileSchema({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" }
                },
                allOf: [
                    {
                        required: ["title"],
                        properties: {
                            title: { type: "string" }
                        }
                    },
                    {
                        required: [],
                        properties: {
                            time: { type: "number" }
                        }
                    }
                ]
            }).reduceNode("a-value");
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["trigger", "title"],
                properties: {
                    trigger: { type: "boolean" },
                    title: { type: "string" },
                    time: { type: "number" }
                }
            });
        });

        it("should return unique merged required-list of type object", () => {
            const { node } = compileSchema({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" }
                },
                allOf: [
                    {
                        required: ["trigger", "title"],
                        properties: {
                            title: { type: "string" }
                        }
                    }
                ]
            }).reduceNode("a-value");
            assert.deepEqual(node.schema, {
                type: "object",
                required: ["trigger", "title"],
                properties: {
                    trigger: { type: "boolean" },
                    title: { type: "string" }
                }
            });
        });

        describe("contains", () => {
            it("should resolve allOf-contains schema to array-item schema", () => {
                const { node } = compileSchema({
                    allOf: [{ contains: { multipleOf: 2 } }, { contains: { multipleOf: 3 } }]
                }).reduceNode([2, 5]);

                assert.deepEqual(node.schema, { items: { anyOf: [{ multipleOf: 2 }, { multipleOf: 3 }] } });
            });
        });

        describe("if-then-else", () => {
            it("should not return 'then'-schema when 'if' does not match", () => {
                const { node } = compileSchema({
                    type: "object",
                    required: ["trigger"],
                    properties: { trigger: { type: "boolean" } },
                    allOf: [
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: { properties: { additionalSchema: { type: "string", default: "additional" } } }
                        }
                    ]
                }).reduceNode({ trigger: false });
                assert.deepEqual(node.schema, {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    }
                });
            });

            it("should return 'then'-schema when 'if' does match", () => {
                const { node } = compileSchema({
                    type: "object",
                    required: ["trigger"],
                    properties: { trigger: { type: "boolean" } },
                    allOf: [
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: { properties: { additionalSchema: { type: "string", default: "additional" } } }
                        }
                    ]
                }).reduceNode({ trigger: true });
                assert.deepEqual(node.schema, {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" },
                        additionalSchema: { type: "string", default: "additional" }
                    }
                });
            });

            it("should merge multiple 'then'-schema", () => {
                const { node } = compileSchema({
                    type: "object",
                    required: ["trigger"],
                    properties: { trigger: { type: "boolean" } },
                    allOf: [
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: { properties: { additionalSchema: { type: "string", default: "additional" } } }
                        },
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: { properties: { anotherSchema: { type: "string", default: "another" } } }
                        }
                    ]
                }).reduceNode({ trigger: true });
                assert.deepEqual(node.schema, {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" },
                        additionalSchema: { type: "string", default: "additional" },
                        anotherSchema: { type: "string", default: "another" }
                    }
                });
            });

            it("should merge only matching 'if'-schema", () => {
                const { node } = compileSchema({
                    type: "object",
                    required: ["trigger"],
                    properties: { trigger: { type: "boolean" } },
                    allOf: [
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: { properties: { additionalSchema: { type: "string", default: "additional" } } }
                        },
                        {
                            if: {
                                required: ["additionalSchema"],
                                properties: { additionalSchema: { type: "string", minLength: 50 } }
                            },
                            then: { properties: { anotherSchema: { type: "string", default: "another" } } }
                        }
                    ]
                }).reduceNode({ trigger: true });
                assert.deepEqual(node.schema, {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" },
                        additionalSchema: { type: "string", default: "additional" }
                    }
                });
            });

            it("should incrementally resolve multiple 'then'-schema", () => {
                const { node } = compileSchema({
                    type: "object",
                    required: ["trigger"],
                    properties: { trigger: { type: "boolean" } },
                    allOf: [
                        {
                            if: { properties: { trigger: { const: true } } },
                            then: {
                                required: ["additionalSchema"],
                                properties: { additionalSchema: { type: "string", default: "additional" } }
                            }
                        },
                        {
                            if: { required: ["additionalSchema"], properties: { additionalSchema: { minLength: 5 } } },
                            then: {
                                required: ["anotherSchema"],
                                properties: { anotherSchema: { type: "string", default: "another" } }
                            }
                        }
                    ]
                }).reduceNode({ trigger: true, additionalSchema: "12345" });
                assert.deepEqual(node.schema, {
                    type: "object",
                    required: ["trigger", "additionalSchema", "anotherSchema"],
                    properties: {
                        trigger: { type: "boolean" },
                        additionalSchema: { type: "string", default: "additional" },
                        anotherSchema: { type: "string", default: "another" }
                    }
                });
            });
        });
    });

    describe("object - recursively resolve dynamic properties", () => {
        it("should reduce allOf and oneOf", () => {
            const node = compileSchema({
                allOf: [
                    {
                        oneOf: [
                            { type: "string", minLength: 1 },
                            { type: "number", minimum: 1 }
                        ]
                    }
                ]
            });

            const schema = node.reduceNode(123)?.node?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should reduce oneOf and allOf", () => {
            const node = compileSchema({
                oneOf: [{ allOf: [{ type: "string", minLength: 1 }] }, { allOf: [{ type: "number", minimum: 1 }] }]
            });

            const schema = node.reduceNode(123)?.node?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should iteratively resolve allOf before merging (issue#44)", () => {
            const { node } = compileSchema({
                type: "object",
                properties: { trigger: { type: "boolean" } },
                allOf: [
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: true } }
                            }
                        },
                        then: {
                            properties: { trigger: { type: "boolean", const: false } }
                        }
                    },
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: false } }
                            }
                        },
                        then: {
                            properties: { trigger: { const: true } }
                        }
                    }
                ]
            }).reduceNode({ trigger: true });

            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean", const: true }
                }
            });
        });
    });

    describe("$ref", () => {
        it("should resolve to $ref referenced schema", () => {
            const { node } = compileSchema({
                $ref: "/$defs/one",
                $defs: {
                    one: { type: "boolean", title: "one" }
                }
            }).reduceNode(3);

            assert.deepEqual(node.schema, { type: "boolean", title: "one" });
        });

        it("should resolve to multiple $ref referenced schema", () => {
            const { node } = compileSchema({
                $ref: "/$defs/one",
                $defs: {
                    one: { $ref: "/$defs/two" },
                    two: { type: "boolean", title: "two" }
                }
            }).reduceNode(3);

            assert.deepEqual(node.schema, { type: "boolean", title: "two" });
        });

        it("should merge nested sub-schema", () => {
            const { node } = compileSchema({
                $ref: "/$defs/one",
                description: "from root",
                $defs: {
                    one: { default: "from one", $ref: "/$defs/two" },
                    two: { type: "boolean", title: "from two" }
                }
            }).reduceNode(3);

            assert.deepEqual(node.schema, {
                description: "from root",
                default: "from one",
                title: "from two",
                type: "boolean"
            });
        });
    });

    describe("dynamicId", () => {
        it("should add dynamicId based on merge anyOf schema", () => {
            const { node } = compileSchema({
                anyOf: [{ type: "string" }, { minimum: 1 }]
            }).reduceNode(3);

            assert.deepEqual(node.dynamicId, "#(anyOf/1)");
        });

        it("should add dynamicId based on all merged anyOf schema", () => {
            const { node } = compileSchema({
                anyOf: [{ type: "number" }, { minimum: 1 }]
            }).reduceNode(3);

            assert.deepEqual(node.dynamicId, "#(anyOf/0,anyOf/1)");
        });

        it("should add dynamicId based on merge anyOf schema", () => {
            const { node } = compileSchema({
                allOf: [{ type: "number" }, { title: "dynamic id" }]
            }).reduceNode(3);

            assert.deepEqual(node.dynamicId, "#(allOf/0,allOf/1)");
        });

        it("should combine dynamicId from `anyOf` and `allOf` schema", () => {
            const { node } = compileSchema({
                allOf: [{ type: "number" }, { title: "dynamic id" }],
                anyOf: [{ minimum: 1 }]
            }).reduceNode(3);

            assert.deepEqual(node.dynamicId, "#(allOf/0,allOf/1)+#(anyOf/0)");
        });

        it("should add dynamicId based on `then` schema", () => {
            const { node } = compileSchema({
                if: { const: 3 },
                then: { type: "string" }
            }).reduceNode(3);

            assert.deepEqual(node.dynamicId, "#(then)");
        });

        it("should add dynamicId based on `else` schema", () => {
            const { node } = compileSchema({
                if: { const: 3 },
                then: { type: "string" },
                else: { type: "number" }
            }).reduceNode(2);

            assert.deepEqual(node.dynamicId, "#(else)");
        });

        it("should add dynamicId based on selected `patternProperties`", () => {
            const { node } = compileSchema({
                patternProperties: {
                    muh: { type: "string" },
                    rooar: { type: "bolean" }
                }
            }).reduceNode({ muh: "" });

            assert.deepEqual(node.dynamicId, "#(patternProperties/muh)");
        });

        it("should add dynamicId based on selected `dependentSchemas`", () => {
            const { node } = compileSchema({
                dependentSchemas: {
                    muh: { properties: { title: { type: "string" } } },
                    rooar: { properties: { header: { type: "boolean" } } }
                }
            }).reduceNode({ muh: "", rooar: true });

            assert.deepEqual(node.dynamicId, "#(dependentSchemas/muh,dependentSchemas/rooar)");
        });

        it("should add dynamicId based on selected `dependencies`", () => {
            const { node } = compileSchema({
                dependencies: {
                    one: ["two"],
                    two: { properties: { header: { type: "boolean" } } }
                }
            }).reduceNode({ one: true });

            assert.deepEqual(node.dynamicId, "#(dependencies/one,dependencies/two)");
        });

        it("should prefix with schemaLocation", () => {
            const { node } =
                compileSchema({
                    properties: {
                        counter: { anyOf: [{ type: "number" }, { minimum: 1 }] }
                    }
                })
                    .getNodeChild("counter", { counter: 3 })
                    .node?.reduceNode(3) ?? {};

            assert.deepEqual(node.dynamicId, "#/properties/counter(anyOf/0,anyOf/1)");
        });

        it("should maintain dynamicId through nested reduce-calls", () => {
            const { node } =
                compileSchema({
                    allOf: [
                        {
                            properties: {
                                counter: { anyOf: [{ type: "number" }, { minimum: 1 }] }
                            }
                        }
                    ]
                })
                    .getNodeChild("counter", { counter: 3 })
                    .node?.reduceNode(3) ?? {};

            assert.deepEqual(node.dynamicId, "#(allOf/0)+#/properties/counter(anyOf/0,anyOf/1)");
        });

        it("should add dynamicId from nested reducers in allOf", () => {
            const { node } = compileSchema({
                allOf: [
                    {
                        anyOf: [{ type: "string" }, { minimum: 1 }]
                    }
                ]
            }).reduceNode(2);

            assert.deepEqual(node.dynamicId, "#(#/allOf/0(anyOf/1))");
        });

        it("should add dynamicId from nested reducers in anyOf", () => {
            const { node } = compileSchema({
                anyOf: [
                    {
                        allOf: [{ type: "number" }, { minimum: 1 }]
                    }
                ]
            }).reduceNode(2);

            assert.deepEqual(node.dynamicId, "#(#/anyOf/0(allOf/0,allOf/1))");
        });

        it("should add dynamicId from nested reducers in then", () => {
            const { node } = compileSchema({
                if: { minimum: 1 },
                then: {
                    allOf: [{ type: "number" }, { title: "order" }]
                }
            }).reduceNode(2);

            assert.deepEqual(node.dynamicId, "#/then(allOf/0,allOf/1)");
        });
    });
});
