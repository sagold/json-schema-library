import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";

describe("compileSchema : reduceSchema", () => {
    describe("behaviour", () => {});

    it("should return schema for boolean schema true", () => {
        // @ts-expect-error boolean schema still untyped
        const node = compileSchema(true);

        const schema = node.reduceSchema(123)?.node?.schema;

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

        const dataNode = node.reduceSchema({ withHeader: true });

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

        const schema = node.reduceSchema({ withHeader: true, header: "huhu" })?.node?.schema;

        assert.deepEqual(schema, {
            type: "object",
            required: ["date", "header"],
            properties: {
                header: { type: "string", minLength: 1 },
                date: { type: "string", format: "date" }
            }
        });
    });

    // we do not reduce recursively in v2
    // it.only("should recursively compile schema with current data", () => {
    //     const node = compileSchema({
    //         type: "object",
    //         properties: {
    //             article: {
    //                 type: "object",
    //                 if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
    //                 then: {
    //                     required: ["header"],
    //                     properties: { header: { type: "string", minLength: 1 } }
    //                 }
    //             }
    //         }
    //     });

    //     const dataNode = node.reduceSchema({ article: { withHeader: true } } );

    //     assert.deepEqual(dataNode?.node?.schema, {
    //         type: "object",
    //         properties: {
    //             article: {
    //                 type: "object",
    //                 required: ["header"],
    //                 properties: { header: { type: "string", minLength: 1 } }
    //             }
    //         }
    //     });
    // });

    describe("object - merge all reduced dynamic schema", () => {
        it("should reduce patternProperties and allOf", () => {
            const node = compileSchema({
                allOf: [{ properties: { "107": { type: "string", maxLength: 99 } } }],
                patternProperties: { "[0-1][0-1]7": { type: "string", minLength: 1 } }
            });

            const schema = node.reduceSchema({ "107": undefined })?.node?.schema;

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
            const { node: reduced } = node.reduceSchema({ one: "" });
            assert.deepEqual(reduced.schema, {
                type: "object",
                required: ["one", "two", "three"],
                properties: { one: { type: "string" }, two: { type: "string" }, three: { type: "number" } }
            });
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
            }).reduceSchema({});
            assert.deepEqual(node.schema, {
                type: "object",
                required: [],
                properties: { one: { type: "string" }, two: { type: "string" } }
            });
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
            }).reduceSchema({ one: "" });
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
            }).reduceSchema({ one: "" });
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
            }).reduceSchema({ one: "" });
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
            }).reduceSchema({});
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
            }).reduceSchema({});
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
            }).reduceSchema({});
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
            }).reduceSchema({ one: "string" });
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
            }).reduceSchema({ id: "second" });
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
            }).reduceSchema({ id: "second" });

            assert.deepEqual(node.schema, { type: "object" });
        });

        it("should return matching oneOf schema", () => {
            const { node } = compileSchema({
                type: "object",
                anyOf: [{ properties: { id: { const: "second" } } }]
            }).reduceSchema({ data: { id: "second" } });
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
            }).reduceSchema({ id: "second" });

            assert.deepEqual(node.schema, { type: "object", properties: { id: { const: "second", minLength: 4 } } });
        });

        it("should correctly reduce multiple prefixItems", () => {
            const { node } = compileSchema({
                prefixItems: [{ const: "foo" }],
                anyOf: [{ prefixItems: [true, { const: "bar" }] }, { prefixItems: [true, true, { const: "baz" }] }]
            }).reduceSchema(["foo", "bar"]);

            assert.deepEqual(node.schema, { prefixItems: [true, true, { const: "baz" }] });
        });
    });

    describe("allOf", () => {
        it("should return merged schema of type string", () => {
            const { node } = compileSchema({
                type: "string",
                allOf: [{ minLength: 10 }, { pattern: /a-.*/ }]
            }).reduceSchema("a-value");
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
            }).reduceSchema("a-value");
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
            }).reduceSchema("a-value");
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
            }).reduceSchema("a-value");
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
            }).reduceSchema("a-value");
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
                }).reduceSchema([2, 5]);

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
                }).reduceSchema({ trigger: false });
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
                }).reduceSchema({ trigger: true });
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
                }).reduceSchema({ trigger: true });
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
                }).reduceSchema({ trigger: true });
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
                }).reduceSchema({ trigger: true, additionalSchema: "12345" });
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

            const schema = node.reduceSchema(123)?.node?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should reduce oneOf and allOf", () => {
            const node = compileSchema({
                oneOf: [{ allOf: [{ type: "string", minLength: 1 }] }, { allOf: [{ type: "number", minimum: 1 }] }]
            });

            const schema = node.reduceSchema(123)?.node?.schema;

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
            }).reduceSchema({ trigger: true });

            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean", const: true }
                }
            });
        });
    });
});
