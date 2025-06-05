import { compileSchema } from "../compileSchema";
import { strict as assert } from "assert";

describe("getData", () => {
    it("should not modify input schema", () => {
        const schema = {
            type: "object",
            properties: {
                title: { type: "string", default: "title" },
                list: {
                    type: "array",
                    items: { allOf: [{ type: "object" }, { properties: { index: { type: "number", default: 4 } } }] }
                },
                author: {
                    anyOf: [
                        { type: "string", default: "jane" },
                        { type: "string", default: "john" }
                    ]
                },
                source: { type: "string", enum: ["dpa", "getty"] }
            }
        };
        const originalSchema = JSON.stringify(schema);
        const node = compileSchema(schema);
        node.getData({});
        assert.deepEqual(JSON.stringify(schema), originalSchema);
    });

    describe("values", () => {
        it("should return default value missing input and type", () => {
            const data = compileSchema({ default: 123 }).getData();
            assert.deepEqual(data, 123);
        });

        it("should NOT override input value for missing type", () => {
            const data = compileSchema({ default: 123 }).getData("input");
            assert.deepEqual(data, "input");
        });

        // @attention, changing input data
        it("should alwayys return const value", () => {
            const data = compileSchema({ const: "const", default: 123 }).getData(123);
            assert.deepEqual(data, "const");
        });

        it("should prefer const over default", () => {
            const data = compileSchema({
                type: "string",
                const: "static",
                default: "should be overwritten"
            }).getData();
            assert.deepEqual(data, "static");
        });

        describe("string", () => {
            it("should return empty string for missing default value", () => {
                const data = compileSchema({ type: "string" }).getData();
                assert.deepEqual(data, "");
            });

            it("should return default value", () => {
                const data = compileSchema({
                    type: "string",
                    default: "default"
                }).getData();
                assert.deepEqual(data, "default");
            });

            it("should return string data", () => {
                const data = compileSchema({
                    type: "string",
                    default: "default"
                }).getData("input");
                assert.deepEqual(data, "input");
            });
        });

        describe("number", () => {
            it("should return 0 for missing default value", () => {
                const data = compileSchema({ type: "number" }).getData();
                assert.deepEqual(data, 0);
            });

            it("should return default value", () => {
                const data = compileSchema({ type: "number", default: 99 }).getData();
                assert.deepEqual(data, 99);
            });

            it("should return number data", () => {
                const data = compileSchema({ type: "number", default: 99 }).getData(123);
                assert.deepEqual(data, 123);
            });
        });

        describe("integer", () => {});

        describe("boolean", () => {
            it("should return `false` for missing default value", () => {
                const data = compileSchema({ type: "boolean", default: false }).getData();
                assert.deepEqual(data, false);
            });

            it("should return default value of boolean", () => {
                const data = compileSchema({ type: "boolean", default: false }).getData();
                assert.deepEqual(data, false);
            });

            it("should not override given boolean if it is `false`", () => {
                const data = compileSchema({ type: "boolean", default: true }).getData(false);
                assert.deepEqual(data, false);
            });

            it("should not override given boolean if it is `true`", () => {
                const data = compileSchema({ type: "boolean", default: false }).getData(true);
                assert.deepEqual(data, true);
            });
        });

        describe("null", () => {
            it("should return `null` for missing default value", () => {
                const data = compileSchema({ type: "null" }).getData();
                assert.deepEqual(data, null);
            });

            it("should return `null` when first type in type-array", () => {
                const node = compileSchema({ type: ["null", "string"] });
                const res = node.getData();

                assert.deepEqual(res, null);
            });

            it("should return default value of null", () => {
                const data = compileSchema({ type: "null", default: null }).getData();
                assert.deepEqual(data, null);
            });

            it("should return default value of null even for wrong typye", () => {
                const data = compileSchema({ type: "number", default: null }).getData();
                assert.deepEqual(data, null);
            });

            it("should support `null` type properties", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["nullType"],
                    properties: { nullType: { type: "null" } }
                }).getData();
                assert.deepEqual(data, { nullType: null });
            });

            it("should return `null` input for strings", () => {
                const data = compileSchema({ type: "string" }).getData(null);
                assert.deepEqual(data, null);
            });

            it("should return `null` input for value-property", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["title"],
                    properties: { title: { type: "number" } }
                }).getData({ title: null });
                assert.deepEqual(data, { title: null });
            });
        });

        describe("enum", () => {
            it("should set the first enum option for a missing default", () => {
                const data = compileSchema({ enum: ["first", "second"] }).getData();
                assert.deepEqual(data, "first");
            });

            it("should use default value in any case", () => {
                const data = compileSchema({ enum: ["first", "second"], default: "" }).getData();
                assert.deepEqual(data, "");
            });
        });

        describe("file", () => {
            it("should not modify file-instance", () => {
                const file = new File([], "testfile.pdf");
                const data = compileSchema({
                    type: ["string", "object"],
                    format: "file"
                }).getData(file);
                assert.deepEqual(data, file);
            });

            it("should not modify file-instance on object", () => {
                const file = new File([], "testfile.pdf");
                const data = compileSchema({
                    type: "object",
                    properties: { file: { type: ["string", "object"], format: "file" } }
                }).getData({ file });
                assert.deepEqual(data, { file });
            });
        });

        describe("oneOf", () => {
            it("should return first schema for mixed types", () => {
                const node = compileSchema({
                    oneOf: [{ type: "string", default: "jane" }, { type: "number" }]
                });
                const res = node.getData();

                assert.deepEqual(res, "jane");
            });
        });
    });

    describe("object", () => {
        describe("behaviour", () => {
            it("should return {} for a missing default value", () => {
                const data = compileSchema({ type: "object" }).getData();
                assert.deepEqual(data, {});
            });

            it("should return default value of object", () => {
                const data = compileSchema({
                    type: "object",
                    default: { init: true }
                }).getData();
                assert.deepEqual(data, { init: true });
            });

            it("should return input data", () => {
                const data = compileSchema({ type: "object" }).getData({ init: false });
                assert.deepEqual(data, { init: false });
            });

            it("should override default by input data", () => {
                const data = compileSchema({
                    type: "object",
                    default: { init: true }
                }).getData({ init: false });
                assert.deepEqual(data, { init: false });
            });
        });

        describe("properties", () => {
            it("should return default object", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getData();
                assert.deepEqual(data, { first: "john", second: 4 });
            });

            it("should return only required object properties", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first"],
                    properties: { first: { type: "string" }, second: { type: "number" } }
                }).getData();
                assert.deepEqual(data, { first: "" });
            });

            it("should not fail on falsy input data", () => {
                const data = compileSchema({
                    type: "object",
                    properties: {
                        first: { type: "boolean", default: true },
                        second: { type: "boolean", default: false }
                    }
                }).getData({ first: false, second: true });
                assert.deepEqual(data, { first: false, second: true });
            });

            it("should return all object properties with `addOptionalProps=true`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" }, second: { type: "number" } }
                }).getData({}, { addOptionalProps: true });
                assert.deepEqual(data, { first: "", second: 0 });
            });

            it("should NOT override given default values by other default values", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string", default: "jane" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getData();
                assert.deepEqual(data, { first: "john", second: 4 });
            });

            it("should extend given template data by property default values", () => {
                const data = compileSchema({
                    type: "object",
                    properties: { first: { type: "string", default: "jane" }, second: { type: "number" } },
                    default: { first: "john", second: 4 }
                }).getData({ second: 8 });
                assert.deepEqual(data, { first: "john", second: 8 });
            });
        });

        describe("additionalProperties & option: removeInvalidData", () => {
            it("should NOT remove additional properties `additionalProperties=undefined`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } }
                }).getData({ first: "first", second: 42 });
                assert.deepEqual(data, { first: "first", second: 42 });
            });

            it("should NOT remove additional properties `additionalProperties=true`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } },
                    additionalProperties: true
                }).getData({ first: "first", second: 42 });
                assert.deepEqual(data, { first: "first", second: 42 });
            });

            it("should NOT remove non matching properties with `additionalProperties={schema}`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } },
                    additionalProperties: { type: "string" }
                }).getData({ first: "first", second: 42 });
                assert.deepEqual(data, { first: "first", second: 42 });
            });

            it("should NOT remove additional properties with `additionalProperties=false`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } },
                    additionalProperties: false
                }).getData({ first: "first", second: 42 });
                assert.deepEqual(data, { first: "first", second: 42 });
            });

            it("should remove unmatched properties with option `removeInvalidData=true`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } },
                    additionalProperties: false
                }).getData({ first: "first", second: 42, thrid: "third" }, { removeInvalidData: true });
                assert.deepEqual(data, { first: "first" });
            });

            it("should remove invalid properties with option `removeInvalidData=true`", () => {
                const data = compileSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: { first: { type: "string" } },
                    additionalProperties: { type: "number" }
                }).getData({ first: "first", second: 42, third: "third", fourth: false }, { removeInvalidData: true });
                assert.deepEqual(data, { first: "first", second: 42 });
            });
        });

        // patternNames
        // patternProperties
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
                }).getData({ name: "john" });
                assert.deepEqual(data, { name: "john", stage: "test" });
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
                const res = node.getData({ name: "john" });

                assert.deepEqual(res, { name: "john", stage: "develop" });
            });
        });

        describe("oneOf", () => {
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
                    const res = node.getData();

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
                    const res = node.getData({});

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
                    const res = node.getData({ value: 111 });

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
                    const res = node.getData({ value: ["keep-me"] });

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

                    const res = node.getData({ type: "paragraph" });
                    assert.deepEqual(res, { type: "paragraph" });
                });

                it("should return valid default data", () => {
                    const node = compileSchema({
                        type: "object",
                        default: { value: 123 },
                        oneOf: [
                            {
                                type: "object",
                                required: ["title"],
                                properties: { title: { type: "string", default: "jane" } }
                            },
                            { type: "object", required: ["value"], properties: { value: { type: "number" } } }
                        ]
                    });
                    const res = node.getData();

                    assert.deepEqual(res, { value: 123 });
                });

                it("should return invalid default data", () => {
                    const node = compileSchema({
                        type: "object",
                        default: { value: "wrong type" },
                        oneOf: [
                            {
                                type: "object",
                                required: ["title"],
                                properties: { title: { type: "string", default: "jane" } }
                            },
                            { type: "object", required: ["value"], properties: { value: { type: "number" } } }
                        ]
                    });
                    const res = node.getData();

                    assert.deepEqual(res, { value: "wrong type" });
                });

                it("should add correct optional properties from schema matching default data", () => {
                    const node = compileSchema({
                        type: "object",
                        default: { value: 123 },
                        oneOf: [
                            {
                                type: "object",
                                required: ["title"],
                                properties: { title: { type: "string", default: "jane" } }
                            },
                            {
                                type: "object",
                                required: ["value"],
                                properties: { value: { type: "number" }, optional: { type: "string" } }
                            }
                        ]
                    });
                    const res = node.getData(undefined, { addOptionalProps: true });

                    assert.deepEqual(res, { value: 123, optional: "" });
                });
            });
        });
    });

    describe("array", () => {
        describe("behaviour", () => {
            it("should return [] for a missing default value", () => {
                const data = compileSchema({ type: "array" }).getData();
                assert.deepEqual(data, []);
            });

            it("should return default value of object", () => {
                const data = compileSchema({ type: "array", default: [true] }).getData();
                assert.deepEqual(data, [true]);
            });

            it("should return input data", () => {
                const data = compileSchema({ type: "array" }).getData(["input"]);
                assert.deepEqual(data, ["input"]);
            });

            it("should override default by input data", () => {
                const data = compileSchema({
                    type: "array",
                    default: ["default"]
                }).getData(["input"]);
                assert.deepEqual(data, ["input"]);
            });
        });

        describe("items: {}", () => {
            it("should return empty array if minItems is undefined", () => {
                const data = compileSchema({ items: { type: "boolean" } }).getData();
                assert.deepEqual(data, []);
            });

            it("should return array with length of minItems", () => {
                const data = compileSchema({
                    minItems: 3,
                    items: { type: "boolean" }
                }).getData();
                assert(Array.isArray(data));
                assert.deepEqual(data.length, 3);
                assert.deepEqual(data, [false, false, false]);
            });

            it("should return default array even if minItems is not set", () => {
                const data = compileSchema({
                    default: ["a", "b"],
                    items: { type: "string" }
                }).getData();
                assert.deepEqual(data, ["a", "b"]);
            });

            it("should return default array if part of object", () => {
                const data = compileSchema({
                    required: ["list"],
                    properties: { list: { type: "array", default: ["a", "b"], items: { type: "string" } } }
                }).getData();
                assert.deepEqual(data, { list: ["a", "b"] });
            });

            it("should not override given default values", () => {
                const data = compileSchema({
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: { type: "string", default: "elvis" }
                }).getData();
                assert.deepEqual(data, ["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                const data = compileSchema({
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: { type: "string" }
                }).getData(["elvis"]);
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
                }).getData([{ first: "user input" }, {}]);
                assert.deepEqual(data, [
                    { first: "user input", second: "second" },
                    { first: "first", second: "second" }
                ]);
            });
        });

        describe("prefixItems: []", () => {
            // - Tuple validation is useful when the array is a collection of items where each has a different schema
            // and the ordinal index of each item is meaningful.
            // - It’s ok to not provide all of the items:
            // https://spacetelescope.github.io/understanding-json-schema/reference/array.html#tuple-validation
            it("should return array with minItems in given order", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    prefixItems: [{ type: "string" }, { type: "boolean" }]
                }).getData();
                assert.deepEqual(data, ["", false]);
            });

            it("should not override input items when complementing minItems", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    prefixItems: [{ type: "boolean", default: false }, { type: "string" }]
                }).getData([true]);
                assert.deepEqual(data, [true, ""]);
            });

            it("should not override wrong input items", () => {
                const data = compileSchema({
                    type: "array",
                    prefixItems: [
                        { type: "boolean", default: false },
                        { type: "string", default: "default" }
                    ]
                }).getData([42, false]);
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
                }).getData();
                assert.deepEqual(data, [true]);
            });

            it("should convert input data for strings", () => {
                const node = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "string" }]
                });
                const res = node.getData([43]);

                assert.deepEqual(res, ["43"]);
            });

            it("should convert input data for numbers", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "number" }]
                }).getData(["43"]);
                assert.deepEqual(data, [43]);
            });

            it("should convert input data for strings", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "string" }]
                }).getData([43]);
                assert.deepEqual(data, ["43"]);
            });

            it("should NOT convert invalid number if we would lose data", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "number" }]
                }).getData(["asd"]);
                assert.deepEqual(data, ["asd"]);
            });

            it("should convert input data for booleans", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "boolean" }]
                }).getData(["false"]);
                assert.deepEqual(data, [false]);
            });

            it("should NOT convert invalid boolean if we would lose data", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 1,
                    prefixItems: [{ type: "boolean" }]
                }).getData(["43"]);
                assert.deepEqual(data, ["43"]);
            });

            it("should add defaults from `items`", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "number",
                        default: 2
                    }
                }).getData([43]);
                assert.deepEqual(data, [43, 2]);
            });

            it("should add defaults from `items` for items not in prefixItems", () => {
                const data = compileSchema({
                    type: "array",
                    minItems: 2,
                    prefixItems: [{ type: "boolean" }],
                    items: { type: "number", default: 2 }
                }).getData([43]);
                assert.deepEqual(data, [43, 2]);
            });

            it("should add prefixItems with `addOptionalProps: true`", () => {
                const data = compileSchema(
                    {
                        type: "array",
                        prefixItems: [{ type: "boolean", default: true }],
                        items: { type: "number", default: 2 }
                    },
                    {
                        getDataDefaultOptions: { addOptionalProps: true }
                    }
                ).getData();
                assert.deepEqual(data, [true]);
            });
        });

        describe("oneOf", () => {
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
                const res = node.getData();

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

                const res = node.getData([{ subtitle: "Subtitel" }]);

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
                const res = node.getData({ filter: [{ op: "möp" }] });
                assert.deepEqual(res, { filter: [{ op: "möp" }] });
            });
        });

        describe("allOf", () => {
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

                const res = node.getData([{ title: "given-title" }]);
                assert.deepEqual(res, [
                    { title: "given-title", caption: "caption" },
                    { title: "title", caption: "caption" }
                ]);
            });
        });

        describe("anyOf", () => {
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

                const res = node.getData([{ title: "given-title" }]);
                assert.deepEqual(res, [{ title: "given-title" }, { title: "title" }]);
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

                        const res = node.getData({}, TEMPLATE_OPTIONS);
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

                        const res = node.getData({ trigger: "yes" }, TEMPLATE_OPTIONS);
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

                        const res = node.getData({}, TEMPLATE_OPTIONS);
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

                        const res = node.getData({}, TEMPLATE_OPTIONS);
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

                        const res = node.getData({ trigger: "yes" }, TEMPLATE_OPTIONS);
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
                    const res = node.getData(undefined, {
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
                    const res = node.getData(
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
                    const res = node.getData(undefined, {
                        addOptionalProps: true
                    });
                    assert.deepEqual(res, { test: "tested value" });
                });
            });
        });
    });

    describe("$ref", () => {
        it("should return default value of resolved ref", () => {
            const data = compileSchema({
                $ref: "#/$defs/once",
                $defs: { once: { default: "once" } }
            }).getData();
            assert.deepEqual(data, "once");
        });

        it("should follow all refs", () => {
            const data = compileSchema({
                $ref: "#/$defs/once",
                $defs: { once: { $ref: "#/$defs/twice" }, twice: { default: "twice" } }
            }).getData();
            assert.deepEqual(data, "twice");
        });

        it("should resolve $ref in object schema", () => {
            const data = compileSchema({
                type: "object",
                required: ["first"],
                properties: { first: { $ref: "#/definitions/first" } },
                definitions: { first: { type: "string", default: "john" } }
            }).getData();
            assert.deepEqual(data, { first: "john" });
        });

        it("should create template for all followed refs (draft 2019-09)", () => {
            const data = compileSchema({
                $ref: "#/$defs/once",
                $defs: {
                    once: { required: ["once"], properties: { once: { type: "number" } }, $ref: "#/$defs/twice" },
                    twice: { required: ["twice"], properties: { twice: { type: "boolean", default: true } } }
                }
            }).getData();
            assert.deepEqual(data, { once: 0, twice: true });
        });

        it("should resolve $ref in items-array", () => {
            const data = compileSchema({
                type: "array",
                prefixItems: [{ $ref: "#/definitions/first" }],
                definitions: {
                    first: {
                        type: "object",
                        required: ["first"],
                        properties: { first: { type: "string", default: "john" } }
                    }
                }
            }).getData([{}, {}]);
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
            }).getData({}, { recursionLimit: 1 });
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
            }).getData([], { recursionLimit: 1 });
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
            }).getData(
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
            const schema = require("../../remotes/draft04.json");
            const node = compileSchema({ ...schema, $schema: "draft-06" });
            const res = node.getData({}, { addOptionalProps: true });
            // console.log("RESULT\n", JSON.stringify(res, null, 2));
            assert.deepEqual(Object.prototype.toString.call(res), "[object Object]");
        });

        it("should create template of draft07", () => {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const data = compileSchema(require("../../remotes/draft07.json")).getData({}, { addOptionalProps: true });
            // console.log("RESULT\n", JSON.stringify(data, null, 2));
            assert.deepEqual(Object.prototype.toString.call(data), "[object Object]");
        });
    });

    describe("if-then-else", () => {
        it("should return template of then-schema for valid if-schema", () => {
            const data = compileSchema({
                type: "object",
                required: ["test"],
                properties: { test: { type: "string", default: "with value" } },
                if: { properties: { test: { type: "string", minLength: 4 } } },
                then: { required: ["dynamic"], properties: { dynamic: { type: "string", default: "from then" } } }
            }).getData();
            assert.deepEqual(data, {
                test: "with value",
                dynamic: "from then"
            });
        });

        it("should NOT create data for then-schema if it is not required", () => {
            const data = compileSchema({
                type: "object",
                required: ["test"],
                properties: { test: { type: "string", default: "with value" } },
                if: { properties: { test: { type: "string", minLength: 4 } } },
                then: { properties: { dynamic: { type: "string", default: "from then" } } }
            }).getData(undefined, { addOptionalProps: false });
            assert.deepEqual(data, { test: "with value" });
        });

        it("should NOT return template of then-schema for invalid if-schema", () => {
            const data = compileSchema({
                type: "object",
                required: ["test"],
                properties: { test: { type: "string", default: "too short" } },
                if: { properties: { test: { type: "string", minLength: 40 } } },
                then: { properties: { dynamic: { type: "string", default: "from then" } } }
            }).getData();
            assert.deepEqual(data, { test: "too short" });
        });

        it("should return template of else-schema for invalid if-schema", () => {
            const data = compileSchema({
                type: "object",
                required: ["test"],
                properties: { test: { type: "string", default: "with test" } },
                if: { properties: { test: { type: "string", minLength: 40 } } },
                then: { required: ["dynamic"], properties: { dynamic: { type: "string", default: "from then" } } },
                else: { required: ["dynamic"], properties: { dynamic: { type: "string", default: "from else" } } }
            }).getData();
            assert.deepEqual(data, { test: "with test", dynamic: "from else" });
        });

        it("should incrementally resolve multiple 'then'-schema", () => {
            const data = compileSchema({
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
            }).getData({ trigger: true });
            assert.deepEqual(data, { trigger: true, additionalSchema: "additional", anotherSchema: "another" });
        });
    });

    describe("type-array", () => {
        it("should return first type of list for template", () => {
            const node = compileSchema({
                type: ["string", "object"]
            });
            const res = node.getData();

            assert.deepEqual(res, "");
        });

        it("should return input data", () => {
            const node = compileSchema({
                type: ["string", "object"]
            });
            const res = node.getData("title");

            assert.deepEqual(res, "title");
        });

        it("should return type of default value if data is not given", () => {
            const node = compileSchema({
                type: ["string", "array", "object"],
                default: []
            });
            const res = node.getData();

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
            const res = node.getData(
                { value: ["remove-me"] },
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

            const template = node.getData(
                {},
                {
                    addOptionalProps: false
                }
            );

            assert.deepEqual({ list: [], author: "jane" }, template);
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
                const res = node.getData(undefined, {
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
                const res = node.getData(undefined, {
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
                const res = node.getData(undefined, {
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
                const res = node.getData(undefined, {
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
                const res = node.getData(undefined, {
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
                const res = node.getData(undefined, {
                    extendDefaults: true
                });

                assert.deepEqual(res, { title: "" });
            });
        });
    });

    describe("defaultTemplateOptions.removeInvalidData", () => {
        it("should NOT remove invalid data per default", () => {
            const node = compileSchema({
                type: "object",
                properties: { valid: { type: "string" } },
                additionalProperties: false
            });
            const res = node.getData({ valid: "stays", invalid: "not removed" });
            assert.deepEqual(res, { valid: "stays", invalid: "not removed" });
        });

        it("should remove invalid data with 'removeInvalidData=true'", () => {
            const node = compileSchema({
                type: "object",
                properties: { valid: { type: "string" } },
                additionalProperties: false
            });
            const res = node.getData({ valid: "stays", invalid: "removes" }, { removeInvalidData: true });
            assert.deepEqual(res, { valid: "stays" });
        });

        it("should NOT remove valid but unspecified data when 'removeInvalidData=true'", () => {
            const node = compileSchema({
                type: "object",
                properties: { valid: { type: "string" } }
            });
            const res = node.getData({ valid: "stays", unspecified: "stays" }, { removeInvalidData: true });
            assert.deepEqual(res, { valid: "stays", unspecified: "stays" });
        });

        it("should remove invalid data with 'removeInvalidData=true' when set as defaultTemplateOptions", () => {
            const node = compileSchema(
                {
                    type: "object",
                    properties: { valid: { type: "string" } },
                    additionalProperties: false
                },
                {
                    getDataDefaultOptions: { removeInvalidData: true }
                }
            );
            const res = node.getData({ valid: "stays", invalid: "removes" });
            assert.deepEqual(res, { valid: "stays" });
        });

        it("should NOT remove invalid data when set per default but overwritten on function", () => {
            const node = compileSchema(
                {
                    type: "object",
                    properties: { valid: { type: "string" } },
                    additionalProperties: false
                },
                {
                    getDataDefaultOptions: { removeInvalidData: true }
                }
            );
            const res = node.getData({ valid: "stays", invalid: "not removed" }, { removeInvalidData: false });
            assert.deepEqual(res, { valid: "stays", invalid: "not removed" });
        });
    });
});
