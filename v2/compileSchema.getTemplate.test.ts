import { isObject } from "../lib/utils/isObject";
import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";

// const spec = [
//     {
//         "should return empty string for missing default value": {
//             schema: { type: "string" },
//             input: undefined,
//             result: ""
//         },
//         "should return default value": {
//             schema: { type: "string", default: "default" },
//             result: "default"
//         },
//         "should return default object": {
//             schema: {
//                 type: "object",
//                 properties: { first: { type: "string" }, second: { type: "number" } },
//                 default: { first: "john", second: 4 }
//             },
//             result: { first: "john", second: 4 }
//         }
//     }
// ];

describe("compileSchema.getTemplate", () => {
    describe("values", () => {
        it("should return default value missing input and type", () => {
            const data = compileSchema({ default: 123 }).getTemplate();
            assert.deepEqual(data, 123);
        });

        it("should NOT override input value for missing type", () => {
            const data = compileSchema({ default: 123 }).getTemplate("input");
            assert.deepEqual(data, "input");
        });

        // @attention, changing input data
        it("should alwayys return const value", () => {
            const data = compileSchema({ const: "const", default: 123 }).getTemplate(123);
            assert.deepEqual(data, "const");
        });

        describe("string", () => {
            it("should return empty string for missing default value", () => {
                const data = compileSchema({ type: "string" }).getTemplate();
                assert.deepEqual(data, "");
            });

            it("should return default value", () => {
                const data = compileSchema({ type: "string", default: "default" }).getTemplate();
                assert.deepEqual(data, "default");
            });

            it("should return string data", () => {
                const data = compileSchema({ type: "string", default: "default" }).getTemplate("input");
                assert.deepEqual(data, "input");
            });
        });
        describe("number", () => {
            it("should return 0 for missing default value", () => {
                const data = compileSchema({ type: "number" }).getTemplate();
                assert.deepEqual(data, 0);
            });

            it("should return default value", () => {
                const data = compileSchema({ type: "number", default: 99 }).getTemplate();
                assert.deepEqual(data, 99);
            });

            it("should return number data", () => {
                const data = compileSchema({ type: "number", default: 99 }).getTemplate(123);
                assert.deepEqual(data, 123);
            });
        });
        describe("integer", () => {});
        describe("boolean", () => {
            it("should return false for missing default value", () => {
                const data = compileSchema({ type: "boolean", default: false }).getTemplate();
                assert.deepEqual(data, false);
            });

            it("should return default value of boolean", () => {
                const data = compileSchema({ type: "boolean", default: false }).getTemplate();
                assert.deepEqual(data, false);
            });

            it("should not override given boolean if it is 'false'", () => {
                const data = compileSchema({ type: "boolean", default: true }).getTemplate(false);
                assert.deepEqual(data, false);
            });

            it("should not override given boolean if it is 'true'", () => {
                const data = compileSchema({ type: "boolean", default: false }).getTemplate(true);
                assert.deepEqual(data, true);
            });
        });
        describe("null", () => {});
        describe("enum", () => {
            it("should set the first enum option for a missing default", () => {
                const data = compileSchema({ enum: ["first", "second"] }).getTemplate();
                assert.deepEqual(data, "first");
            });
        });
    });

    describe("object", () => {
        describe("behaviour", () => {
            it("should return {} for a missing default value", () => {
                const data = compileSchema({ type: "object" }).getTemplate();
                assert.deepEqual(data, {});
            });

            it("should return default value of object", () => {
                const data = compileSchema({ type: "object", default: { init: true } }).getTemplate();
                assert.deepEqual(data, { init: true });
            });

            it("should return input data", () => {
                const data = compileSchema({ type: "object" }).getTemplate({ init: false });
                assert.deepEqual(data, { init: false });
            });

            it("should override default by input data", () => {
                const data = compileSchema({ type: "object", default: { init: true } }).getTemplate({ init: false });
                assert.deepEqual(data, { init: false });
            });
        });

        describe("properties", () => {
            it("should return default object", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getTemplate();
                assert.deepEqual(data, { first: "john", second: 4 });
            });

            it("should return only required object properties", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first"],
                    properties: { first: { type: "string" }, second: { type: "number" } }
                }).getTemplate();
                assert.deepEqual(data, { first: "" });
            });

            it("should not fail on falsy input data", () => {
                const data = compileSchema({
                    type: "object",
                    properties: {
                        first: { type: "boolean", default: true },
                        second: { type: "boolean", default: false }
                    }
                }).getTemplate({ first: false, second: true });
                assert.deepEqual(data, { first: false, second: true });
            });

            it("should return all object properties with `addOptionalProps=true`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" }, second: { type: "number" } }
                }).getTemplate({}, { addOptionalProps: true });
                assert.deepEqual(data, { first: "", second: 0 });
            });

            it("should NOT override given default values by other default values", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string", default: "jane" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getTemplate();
                assert.deepEqual(data, { first: "john", second: 4 });
            });

            it("should extend given template data by property default values", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string", default: "jane" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getTemplate({ second: 8 });
                assert.deepEqual(data, { first: "john", second: 8 });
            });
        });

        // patternNames
        // patternProperties
        // additionalProperties
        // dependentSchemas
        // dependentRequired
        // (unevaluatedPoperties)

        describe("allOf", () => {
            it("should create template for merged allOf schema", () => {
                const data = compileSchema({
                    type: "object",
                    allOf: [
                        {
                            required: ["name"],
                            properties: { name: { type: "string", default: "jane" } }
                        },
                        {
                            required: ["stage"],
                            properties: { stage: { type: "string", default: "test" } }
                        }
                    ]
                }).getTemplate({ name: "john" });
                assert.deepEqual(data, { name: "john", stage: "test" });
            });
        });
    });

    describe("array", () => {
        describe("behaviour", () => {
            it("should return [] for a missing default value", () => {
                const data = compileSchema({ type: "array" }).getTemplate();
                assert.deepEqual(data, []);
            });

            it("should return default value of object", () => {
                const data = compileSchema({ type: "array", default: [true] }).getTemplate();
                assert.deepEqual(data, [true]);
            });

            it("should return input data", () => {
                const data = compileSchema({ type: "array" }).getTemplate(["input"]);
                assert.deepEqual(data, ["input"]);
            });

            it("should override default by input data", () => {
                const data = compileSchema({ type: "array", default: ["default"] }).getTemplate(["input"]);
                assert.deepEqual(data, ["input"]);
            });
        });

        describe("items: {}", () => {
            it("should return empty array if minItems is undefined", () => {
                const data = compileSchema({ items: { type: "boolean" } }).getTemplate();
                assert.deepEqual(data, []);
            });

            it("should return array with length of minItems", () => {
                const data = compileSchema({ minItems: 3, items: { type: "boolean" } }).getTemplate();
                assert(Array.isArray(data));
                assert.deepEqual(data.length, 3);
                assert.deepEqual(data, [false, false, false]);
            });

            it("should return default array even if minItems is not set", () => {
                const data = compileSchema({ default: ["a", "b"], items: { type: "string" } }).getTemplate();
                assert.deepEqual(data, ["a", "b"]);
            });

            it("should return default array if part of object", () => {
                const data = compileSchema({
                    required: ["list"],
                    properties: { list: { type: "array", default: ["a", "b"], items: { type: "string" } } }
                }).getTemplate();
                assert.deepEqual(data, { list: ["a", "b"] });
            });

            it("should not override given default values", () => {
                const data = compileSchema({
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: { type: "string", default: "elvis" }
                }).getTemplate();
                assert.deepEqual(data, ["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                const data = compileSchema({
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: { type: "string" }
                }).getTemplate(["elvis"]);
                assert.deepEqual(data, ["elvis", "doors"]);
            });

            it("should extend all input objects by missing properties", () => {
                const data = compileSchema({
                    default: ["abba", "doors"],
                    items: {
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string", default: "first" },
                            second: { type: "string", default: "second" }
                        }
                    }
                }).getTemplate([{ first: "user input" }, {}]);
                assert.deepEqual(data, [
                    { first: "user input", second: "second" },
                    { first: "first", second: "second" }
                ]);
            });
        });

        describe("items: []", () => {
            // - Tuple validation is useful when the array is a collection of items where each has a different schema
            // and the ordinal index of each item is meaningful.
            // - It’s ok to not provide all of the items:
            // https://spacetelescope.github.io/understanding-json-schema/reference/array.html#tuple-validation
            it("should return array with minItems in given order", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "string" }, { type: "boolean" }]
                }).getTemplate();
                assert.deepEqual(data, ["", false]);
            });

            it("should not override input items when complementing minItems", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "boolean", default: false }, { type: "string" }]
                }).getTemplate([true]);
                assert.deepEqual(data, [true, ""]);
            });

            it("should not override input items with wrong type", () => {
                const data = compileSchema({
                    type: "array",
                    items: [
                        { type: "boolean", default: false },
                        { type: "string", default: "default" }
                    ]
                }).getTemplate([42, false]);
                assert.deepEqual(data, [42, "false"]);
            });

            it("should return default array", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    default: [true],
                    items: {
                        type: "boolean"
                    }
                }).getTemplate();
                assert.deepEqual(data, [true]);
            });

            it("should convert input data for strings", () => {
                const node = compileSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "string" }]
                });
                const res = node.getTemplate([43]);

                assert.deepEqual(res, ["43"]);
            });

            it("should convert input data for numbers", () => {
                const data = compileSchema({ type: "array", minItems: 1, items: [{ type: "number" }] }).getTemplate([
                    "43"
                ]);
                assert.deepEqual(data, [43]);
            });

            it("should NOT convert invalid number if we would lose data", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "number" }]
                }).getTemplate(["asd"]);
                assert.deepEqual(data, ["asd"]);
            });

            it("should convert input data for booleans", () => {
                const data = compileSchema({ type: "array", minItems: 1, items: [{ type: "boolean" }] }).getTemplate([
                    "false"
                ]);
                assert.deepEqual(data, [false]);
            });

            it("should NOT convert invalid boolean if we would lose data", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "boolean" }]
                }).getTemplate(["43"]);
                assert.deepEqual(data, ["43"]);
            });

            it("should add defaults from additionalItems ", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    additionalItems: {
                        type: "number",
                        default: 2
                    }
                }).getTemplate([43]);
                assert.deepEqual(data, [43, 2]);
            });

            it.skip("should add defaults from additionalItems for unspecified items ", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "boolean" }],
                    additionalItems: { type: "number", default: 2 }
                }).getTemplate(["43"]);
                assert.deepEqual(data, [43, 2]);
            });
        });
    });

    describe("$ref", () => {
        it("should return default value of resolved ref", () => {
            const data = compileSchema({ $ref: "#/$defs/once", $defs: { once: { default: "once" } } }).getTemplate();
            assert.deepEqual(data, "once");
        });

        it("should follow all refs", () => {
            const data = compileSchema({
                $ref: "#/$defs/once",
                $defs: { once: { $ref: "#/$defs/twice" }, twice: { default: "twice" } }
            }).getTemplate();
            assert.deepEqual(data, "twice");
        });

        it("should resolve $ref in object schema", () => {
            const data = compileSchema({
                type: "object",
                required: ["first"],
                properties: { first: { $ref: "#/definitions/first" } },
                definitions: { first: { type: "string", default: "john" } }
            }).getTemplate();
            assert.deepEqual(data, { first: "john" });
        });

        it("should create template for all followed refs (draft 2019-09)", () => {
            const data = compileSchema({
                $ref: "#/$defs/once",
                $defs: {
                    once: { required: ["once"], properties: { once: { type: "number" } }, $ref: "#/$defs/twice" },
                    twice: { required: ["twice"], properties: { twice: { type: "boolean", default: true } } }
                }
            }).getTemplate();
            assert.deepEqual(data, { once: 0, twice: true });
        });

        it("should resolve $ref in items-array", () => {
            const data = compileSchema({
                type: "array",
                items: [{ $ref: "#/definitions/first" }],
                definitions: {
                    first: {
                        type: "object",
                        required: ["first"],
                        properties: { first: { type: "string", default: "john" } }
                    }
                }
            }).getTemplate([{}, {}]);
            assert.deepEqual(data, [{ first: "john" }, {}]);
        });

        it("should follow $ref once", () => {
            const data = compileSchema({
                type: "object",
                required: ["value", "nodes"],
                properties: {
                    value: { type: "string", default: "node" },
                    nodes: { type: "array", minItems: 1, items: { $ref: "#" } }
                }
            }).getTemplate({}, { recursionLimit: 1 });
            assert.deepEqual(data, { value: "node", nodes: [{ value: "node", nodes: [] }] });
        });

        it("should resolve all reoccuring refs ", () => {
            const data = compileSchema({
                minItems: 3,
                items: {
                    $ref: "#/$defs/item"
                },
                $defs: {
                    item: {
                        required: ["type"],
                        properties: {
                            type: {
                                const: "node"
                                // $ref: "#"
                            }
                        }
                    }
                }
            }).getTemplate([], { recursionLimit: 1 });
            assert.deepEqual(data, [{ type: "node" }, { type: "node" }, { type: "node" }]);
        });

        // iteration depth is 1, input-depth is 2 => still add template to depth 2
        it("should respect depth of input data in $ref-resolution", () => {
            const data = compileSchema({
                type: "object",
                required: ["value", "nodes"],
                properties: {
                    value: { type: "string", default: "node" },
                    nodes: { type: "array", minItems: 1, items: { $ref: "#" } }
                }
            }).getTemplate(
                { nodes: [{ value: "input-node" }, { nodes: [{ nodes: [] }] }] },
                {
                    recursionLimit: 1
                }
            );

            assert.deepEqual(data, {
                value: "node",
                nodes: [
                    {
                        value: "input-node",
                        nodes: []
                    },
                    {
                        value: "node",
                        nodes: [
                            {
                                value: "node",
                                nodes: []
                            }
                        ]
                    }
                ]
            });
        });

        it("should create template of draft04", () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const schema = require("../remotes/draft04.json");
            const node = compileSchema({ ...schema, $schema: "draft-06" });
            /**
             * creates circular dependencies for
             *
             * anyOf, allOf, oneOf (not array.items) referencing
             *
             * "definitions": {
             *    "schemaArray": {
             *       "type": "array",
             *          "minItems": 1,
             *          "items": { "$ref": "#" }
             */
            // @bug heavy recursion
            // @todo we run into a heavy recursion with addOptionalProps: true - this
            // is only an issue for draft04 refs, probably because they are resolved endlessly
            const res = node.getTemplate({}, { addOptionalProps: false });
            console.log("RESULT\n", JSON.stringify(res, null, 2));
            assert.deepEqual(Object.prototype.toString.call(res), "[object Object]");
        });

        it("should create template of draft07", () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const data = compileSchema(require("../remotes/draft07.json")).getTemplate({}, { addOptionalProps: true });
            console.log("RESULT\n", JSON.stringify(data, null, 2));
            assert.deepEqual(Object.prototype.toString.call(data), "[object Object]");
        });
    });

    // @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
    describe("compileSchema.getTemplate (v1 tests)", () => {
        it("should support null types", () => {
            const node = compileSchema({ type: "null" });
            const res = node.getTemplate();

            assert.deepEqual(res, null);
        });

        it("should support null type properties", () => {
            const node = compileSchema({
                type: "object",
                required: ["nullType"],
                properties: {
                    nullType: { type: "null" }
                }
            });
            const res = node.getTemplate();

            assert.deepEqual(res, { nullType: null });
        });

        it("should not modify input schema", () => {
            const schema = {
                type: "object",
                properties: {
                    title: { type: "string", default: "title" },
                    list: {
                        type: "array",
                        items: {
                            allOf: [
                                { type: "object" },
                                {
                                    properties: {
                                        index: { type: "number", default: 4 }
                                    }
                                }
                            ]
                        }
                    },
                    author: {
                        anyOf: [
                            { type: "string", default: "jane" },
                            { type: "string", default: "john" }
                        ]
                    },
                    source: {
                        type: "string",
                        enum: ["dpa", "getty"]
                    }
                }
            };
            const originalSchema = JSON.stringify(schema);
            const node = compileSchema(schema);
            node.getTemplate({});
            assert.deepEqual(JSON.stringify(schema), originalSchema);
        });

        describe("object", () => {
            describe("additionalProperties", () => {
                it("should not remove additional properties `additionalProperties=undefined`", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        }
                    });

                    const res = node.getTemplate({ first: "first", second: 42 });
                    assert.deepEqual(res, { first: "first", second: 42 });
                });

                it("should not remove additional properties `additionalProperties=true`", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        },
                        additionalProperties: true
                    });

                    const res = node.getTemplate({ first: "first", second: 42 });
                    assert.deepEqual(res, { first: "first", second: 42 });
                });

                it("should not remove non matching properties", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        },
                        additionalProperties: {
                            type: "string"
                        }
                    });

                    const res = node.getTemplate({ first: "first", second: 42 });
                    assert.deepEqual(res, { first: "first", second: 42 });
                });

                it("should not remove additional properties with `additionalProperties=false`", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        },
                        additionalProperties: false
                    });

                    const res = node.getTemplate({ first: "first", second: 42 });
                    assert.deepEqual(res, { first: "first", second: 42 });
                });

                it("should remove unmatched properties with option `removeInvalidData=true`", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        },
                        additionalProperties: false
                    });

                    const res = node.getTemplate(
                        { first: "first", second: 42, thrid: "third" },
                        {
                            removeInvalidData: true
                        }
                    );
                    assert.deepEqual(res, { first: "first" });
                });

                it("should remove invalid properties with option `removeInvalidData=true`", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string" }
                        },
                        additionalProperties: {
                            type: "number"
                        }
                    });

                    const res = node.getTemplate(
                        { first: "first", second: 42, third: "third", fourth: false },
                        {
                            removeInvalidData: true
                        }
                    );
                    assert.deepEqual(res, { first: "first", second: 42 });
                });
            });

            describe("oneOf", () => {
                it("should return template of first oneOf schema", () => {
                    const node = compileSchema({
                        type: "object",
                        oneOf: [
                            {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: { type: "string", default: "jane" }
                                }
                            },
                            {
                                type: "object",
                                required: ["value"],
                                properties: { value: { type: "number" } }
                            }
                        ]
                    });
                    const res = node.getTemplate();

                    assert.deepEqual(res, { title: "jane" });
                });

                it("should extend empty object with first oneOf schema", () => {
                    const node = compileSchema({
                        type: "object",
                        oneOf: [
                            {
                                type: "object",
                                required: ["title"],
                                properties: {
                                    title: { type: "string", default: "jane" }
                                }
                            },
                            {
                                type: "object",
                                required: ["value"],
                                properties: { value: { type: "number" } }
                            }
                        ]
                    });
                    const res = node.getTemplate({});

                    assert.deepEqual(res, { title: "jane" });
                });

                it("should return template of matching oneOf schema", () => {
                    const node = compileSchema({
                        type: "object",
                        oneOf: [
                            {
                                type: "object",
                                required: ["value"],
                                properties: {
                                    value: { type: "string", default: "jane" }
                                }
                            },
                            {
                                type: "object",
                                required: ["value", "test"],
                                properties: {
                                    value: { type: "number" },
                                    test: { type: "string", default: "test" }
                                }
                            }
                        ]
                    });
                    const res = node.getTemplate({ value: 111 });

                    assert.deepEqual(res, { value: 111, test: "test" });
                });

                it("should return input value if no oneOf-schema matches ", () => {
                    const node = compileSchema({
                        type: "object",
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    value: { type: "string", default: "jane" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    value: { type: "number" },
                                    test: { type: "string", default: "test" }
                                }
                            }
                        ]
                    });
                    const res = node.getTemplate({ value: ["keep-me"] });

                    assert.deepEqual(res, { value: ["keep-me"] });
                });

                it("should not require object type definition in oneOf schemas", () => {
                    const node = compileSchema({
                        type: "object",
                        oneOf: [
                            {
                                required: ["type"],
                                properties: {
                                    type: { const: "header" }
                                }
                            },
                            {
                                required: ["type"],
                                properties: {
                                    type: { const: "paragraph" }
                                }
                            }
                        ]
                    });

                    const res = node.getTemplate({ type: "paragraph" });
                    assert.deepEqual(res, { type: "paragraph" });
                });
            });

            describe("anyOf", () => {
                it("should create template for first anyOf schema", () => {
                    const node = compileSchema({
                        type: "object",
                        anyOf: [
                            {
                                required: ["name", "stage"],
                                properties: {
                                    name: { type: "string", default: "jane" },
                                    stage: { type: "string", default: "develop" }
                                }
                            },
                            {
                                required: ["stage"],
                                properties: {
                                    stage: { type: "number", default: 0 }
                                }
                            }
                        ]
                    });
                    const res = node.getTemplate({ name: "john" });

                    assert.deepEqual(res, { name: "john", stage: "develop" });
                });
            });

            // draft07 (backwards compatible)
            describe("dependencies", () => {
                describe("option: `additionalProps: false`", () => {
                    const TEMPLATE_OPTIONS = { addOptionalProps: false };
                    describe("dependency required", () => {
                        it("should not add dependency if it is not required", () => {
                            const node = compileSchema({
                                type: "object",
                                properties: {
                                    trigger: { type: "string" },
                                    dependency: { type: "string", default: "default" }
                                },
                                dependencies: {
                                    trigger: ["dependency"]
                                }
                            });

                            const res = node.getTemplate({}, TEMPLATE_OPTIONS);
                            assert.deepEqual(res, {});
                        });

                        it("should add dependency if triggered as required", () => {
                            const node = compileSchema({
                                type: "object",
                                properties: {
                                    trigger: { type: "string" },
                                    dependency: { type: "string", default: "default" }
                                },
                                dependencies: {
                                    trigger: ["dependency"]
                                }
                            });

                            const res = node.getTemplate({ trigger: "yes" }, TEMPLATE_OPTIONS);
                            assert.deepEqual(res, { trigger: "yes", dependency: "default" });
                        });

                        it("should add dependency if initially triggered as required", () => {
                            const node = compileSchema({
                                type: "object",
                                required: ["trigger"],
                                properties: {
                                    trigger: { type: "string" },
                                    dependency: { type: "string", default: "default" }
                                },
                                dependencies: {
                                    trigger: ["dependency"]
                                }
                            });

                            const res = node.getTemplate({}, TEMPLATE_OPTIONS);
                            assert.deepEqual(res, { trigger: "", dependency: "default" });
                        });
                    });

                    describe("dependency schema", () => {
                        it("should not add dependency from schema if it is not required", () => {
                            const node = compileSchema({
                                type: "object",
                                properties: {
                                    trigger: { type: "string" }
                                },
                                dependencies: {
                                    trigger: {
                                        properties: {
                                            dependency: { type: "string", default: "default" }
                                        }
                                    }
                                }
                            });

                            const res = node.getTemplate({}, TEMPLATE_OPTIONS);
                            assert.deepEqual(res, {});
                        });

                        it("should add dependency from schema if triggered as required", () => {
                            const node = compileSchema({
                                type: "object",
                                properties: {
                                    trigger: { type: "string" }
                                },
                                dependencies: {
                                    trigger: {
                                        required: ["dependency"],
                                        properties: {
                                            dependency: { type: "string", default: "default" }
                                        }
                                    }
                                }
                            });

                            const res = node.getTemplate({ trigger: "yes" }, TEMPLATE_OPTIONS);
                            assert.deepEqual(res, { trigger: "yes", dependency: "default" });
                        });
                    });
                });

                describe("option: `additionalProps: true`", () => {
                    it("should create template for valid dependency", () => {
                        const node = compileSchema({
                            type: "object",
                            properties: {
                                test: { type: "string", default: "tested value" }
                            },
                            dependencies: {
                                test: {
                                    properties: {
                                        additionalValue: { type: "string", default: "additional" }
                                    }
                                }
                            }
                        });
                        const res = node.getTemplate(undefined, {
                            addOptionalProps: true
                        });
                        assert.deepEqual(res, {
                            test: "tested value",
                            additionalValue: "additional"
                        });
                    });

                    it("should not change passed value of dependency", () => {
                        const node = compileSchema({
                            type: "object",
                            properties: {
                                test: { type: "string", default: "tested value" }
                            },
                            dependencies: {
                                test: {
                                    properties: {
                                        additionalValue: { type: "string", default: "additional" }
                                    }
                                }
                            }
                        });
                        const res = node.getTemplate(
                            { additionalValue: "input value" },
                            {
                                addOptionalProps: true
                            }
                        );
                        assert.deepEqual(res, {
                            test: "tested value",
                            additionalValue: "input value"
                        });
                    });

                    it("should not create data for non matching dependency", () => {
                        const node = compileSchema({
                            type: "object",
                            properties: {
                                test: { type: "string", default: "tested value" }
                            },
                            dependencies: {
                                unknown: {
                                    properties: {
                                        additionalValue: { type: "string", default: "additional" }
                                    }
                                }
                            }
                        });
                        const res = node.getTemplate(undefined, {
                            addOptionalProps: true
                        });
                        assert.deepEqual(res, { test: "tested value" });
                    });
                });
            });
        });

        describe("array", () => {
            describe("items.oneOf", () => {
                it("should return template of first oneOf schema", () => {
                    const node = compileSchema({
                        type: "array",
                        minItems: 1,
                        items: {
                            oneOf: [
                                { type: "string", default: "target" },
                                { type: "number", default: 9 }
                            ]
                        }
                    });
                    const res = node.getTemplate();

                    assert(Array.isArray(res));
                    assert.deepEqual(res.length, 1);
                    assert.deepEqual(res, ["target"]);
                });

                it("should merge with input data", () => {
                    const node = compileSchema({
                        type: "array",
                        minItems: 1,
                        items: {
                            oneOf: [
                                {
                                    type: "object",
                                    required: ["notitle"],
                                    properties: {
                                        notitle: {
                                            type: "string",
                                            default: "nottitle"
                                        }
                                    }
                                },
                                {
                                    type: "object",
                                    required: ["title", "subtitle"],
                                    properties: {
                                        title: {
                                            type: "string",
                                            default: "Standardtitel"
                                        },
                                        subtitle: {
                                            type: "string",
                                            default: "do not replace with"
                                        }
                                    }
                                },
                                { type: "number", default: 9 }
                            ]
                        }
                    });

                    const res = node.getTemplate([{ subtitle: "Subtitel" }]);

                    assert(Array.isArray(res));
                    assert.deepEqual(res.length, 1);
                    assert.deepEqual(res, [{ title: "Standardtitel", subtitle: "Subtitel" }]);
                });

                it("should not remove invalid oneOf schema if 'removeInvalidData' is unset", () => {
                    const node = compileSchema({
                        type: "object",
                        properties: {
                            filter: {
                                $ref: "#/definitions/filter"
                            }
                        },
                        definitions: {
                            filter: {
                                type: "array",
                                items: {
                                    oneOf: [
                                        {
                                            type: "object",
                                            properties: {
                                                op: {
                                                    const: "in"
                                                },
                                                property: { type: "string", minLength: 1 }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    });
                    const res = node.getTemplate({ filter: [{ op: "möp" }] });
                    assert.deepEqual(res, { filter: [{ op: "möp" }] });
                });
            });

            describe("items.allOf", () => {
                it("should create template for merged allOf schema", () => {
                    const node = compileSchema({
                        type: "array",
                        minItems: 2,
                        items: {
                            type: "object",
                            allOf: [
                                {
                                    required: ["title"],
                                    properties: {
                                        title: { type: "string", default: "title" }
                                    }
                                },
                                {
                                    required: ["caption"],
                                    properties: {
                                        caption: {
                                            type: "string",
                                            default: "caption"
                                        }
                                    }
                                }
                            ]
                        }
                    });

                    const res = node.getTemplate([{ title: "given-title" }]);
                    assert.deepEqual(res, [
                        { title: "given-title", caption: "caption" },
                        { title: "title", caption: "caption" }
                    ]);
                });
            });

            describe("items.anyOf", () => {
                it("should create template for first anyOf schema", () => {
                    const node = compileSchema({
                        type: "array",
                        minItems: 2,
                        items: {
                            type: "object",
                            anyOf: [
                                {
                                    required: ["title"],
                                    properties: {
                                        title: { type: "string", default: "title" }
                                    }
                                },
                                {
                                    required: ["properties"],
                                    properties: {
                                        caption: {
                                            type: "string",
                                            default: "caption"
                                        }
                                    }
                                }
                            ]
                        }
                    });

                    const res = node.getTemplate([{ title: "given-title" }]);
                    assert.deepEqual(res, [{ title: "given-title" }, { title: "title" }]);
                });
            });
        });

        describe("oneOf", () => {
            it("should return first schema for mixed types", () => {
                const node = compileSchema({
                    oneOf: [{ type: "string", default: "jane" }, { type: "number" }]
                });
                const res = node.getTemplate();

                assert.deepEqual(res, "jane");
            });
        });

        describe("list of types", () => {
            it("should return first type of list for template", () => {
                const node = compileSchema({
                    type: ["string", "object"]
                });
                const res = node.getTemplate();

                assert.deepEqual(res, "");
            });

            it("should return input data", () => {
                const node = compileSchema({
                    type: ["string", "object"]
                });
                const res = node.getTemplate("title");

                assert.deepEqual(res, "title");
            });

            it("should return type of default value if data is not given", () => {
                const node = compileSchema({
                    type: ["string", "array", "object"],
                    default: []
                });
                const res = node.getTemplate();

                assert.deepEqual(res, []);
            });
        });

        describe("templateOptions", () => {
            it("should remove invalid oneOf schema if 'removeInvalidData=true'", () => {
                const node = compileSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            properties: {
                                value: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            properties: {
                                value: { type: "number" },
                                test: { type: "string", default: "test" }
                            }
                        }
                    ]
                });
                const res = node.getTemplate(
                    { value: ["keep-me"] },
                    {
                        removeInvalidData: true
                    }
                );

                assert.deepEqual(res, {});
            });

            it("should not add optional properties", () => {
                const schema = {
                    type: "object",
                    required: ["list", "author"],
                    properties: {
                        title: { type: "string", default: "title" },
                        list: {
                            type: "array",
                            items: {
                                allOf: [
                                    { type: "object" },
                                    {
                                        properties: {
                                            index: { type: "number", default: 4 }
                                        }
                                    }
                                ]
                            }
                        },
                        author: {
                            anyOf: [
                                { type: "string", default: "jane" },
                                { type: "string", default: "john" }
                            ]
                        },
                        source: {
                            type: "string",
                            enum: ["dpa", "getty"]
                        }
                    }
                };
                const node = compileSchema(schema);

                const template = node.getTemplate(
                    {},
                    {
                        addOptionalProps: false
                    }
                );

                assert.deepEqual({ list: [], author: "jane" }, template);
            });

            describe("file", () => {
                it("should not modify file-instance", () => {
                    const file = new File([], "testfile.pdf");
                    const node = compileSchema({
                        type: ["string", "object"],
                        format: "file"
                    });
                    const res = node.getTemplate(file);
                    assert.deepEqual(res, file);
                });

                it("should not modify file-instance on object", () => {
                    const file = new File([], "testfile.pdf");
                    const node = compileSchema({
                        type: "object",
                        properties: {
                            file: {
                                type: ["string", "object"],
                                format: "file"
                            }
                        }
                    });
                    const res = node.getTemplate({ file });
                    assert.deepEqual(res, { file });
                });
            });

            describe("extendDefaults", () => {
                it("should keep array default-value with 'extendDefaults:false'", () => {
                    const node = compileSchema({
                        type: "array",
                        default: [],
                        items: {
                            type: "string",
                            enum: ["one", "two"]
                        },
                        minItems: 1 // usually adds an enty, but default states: []
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: false
                    });

                    assert.deepEqual(res, []);
                });

                it("should add items to array with no default-value given and 'extendDefaults:false'", () => {
                    const node = compileSchema({
                        type: "array",
                        items: {
                            type: "string",
                            enum: ["one", "two"]
                        },
                        minItems: 1 // usually adds an enty, but default states: []
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: false
                    });

                    assert.deepEqual(res, ["one"]);
                });

                it("should add items to default-array with 'extendDefaults:true'", () => {
                    const node = compileSchema({
                        type: "array",
                        default: [],
                        items: {
                            type: "string",
                            enum: ["one", "two"]
                        },
                        minItems: 1 // usually adds an enty, but default states: []
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: true
                    });

                    assert.deepEqual(res, ["one"]);
                });

                it("should not add required items to object with default-value given and 'extendDefaults:false'", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["title"],
                        default: {},
                        properties: {
                            title: { type: "string" }
                        }
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: false
                    });

                    assert.deepEqual(res, {});
                });

                it("should extend object by required property with no default-value given and 'extendDefaults:false'", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["title"],
                        properties: {
                            title: { type: "string" }
                        }
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: false
                    });

                    assert.deepEqual(res, { title: "" });
                });
                it("should extend default-object with 'extendDefaults:true'", () => {
                    const node = compileSchema({
                        type: "object",
                        required: ["title"],
                        default: {},
                        properties: {
                            title: { type: "string" }
                        }
                    });
                    const res = node.getTemplate(undefined, {
                        extendDefaults: true
                    });

                    assert.deepEqual(res, { title: "" });
                });
            });
        });
    });
});
