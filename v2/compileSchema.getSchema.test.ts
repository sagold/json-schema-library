import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode } from "./types";
import { isJsonError } from "../lib/types";
import { pick } from "./utils/pick";

describe("compileSchema : getSchema", () => {
    describe("value", () => {
        it("should return schema of any value", () => {
            const node = compileSchema({ name: "target", type: "*" }).getSchema("#");
            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, { name: "target", type: "*" });
        });

        it("should resolve property through root $ref", () => {
            const node = compileSchema({
                $ref: "#/$defs/root",
                $defs: {
                    root: {
                        type: "object",
                        properties: {
                            value: { type: "number", name: "target" }
                        }
                    }
                }
            }).getSchema("#/value", { value: 123 });
            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, { name: "target", type: "number" });
        });
    });

    describe("object", () => {
        it("should return schema of valid property", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    title: { name: "title", type: "string" }
                }
            });
            const result = node.getSchema("#/title");
            assert(isSchemaNode(result));
            assert.deepEqual(result.schema, { name: "title", type: "string" });
        });

        it.skip("should return `schema-warning` for unknown, but valid property", () => {
            // const node = compileSchema({ type: "object" });
            // const result = node.getSchema("#/title", undefined, { withSchemaWarning: true });
            // assert(isJsonError(result));
            // assert.deepEqual(result, { code: "schema-warning", type: "error" });
        });

        it("should return `undefined` for unknown, but valid property", () => {
            const node = compileSchema({ type: "object" }).getSchema("#/title");
            assert.deepEqual(node, undefined);
        });

        it("should return `undefined` for unknown property if data is passed", () => {
            const node = compileSchema({ type: "object" }).getSchema("#/title", { title: "value" });
            assert.deepEqual(node, undefined);
        });

        it("should return an error for invalid properties", () => {
            const error = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                additionalProperties: false
            }).getSchema("#/unknown");

            assert(isJsonError(error));
            assert.deepEqual(pick(error, "code", "type"), {
                code: "no-additional-properties-error",
                type: "error"
            });
        });

        it("should return an error for invalid properties, even if value is given", () => {
            const error = compileSchema({
                type: "object",
                properties: { title: { type: "string" } },
                additionalProperties: false
            }).getSchema("#/unknown", { unknown: "value" });

            assert(isJsonError(error));
            assert.deepEqual(pick(error, "code", "type"), {
                code: "no-additional-properties-error",
                type: "error"
            });
        });

        it("should return schema for property within nested object", () => {
            const node = compileSchema({
                type: "object",
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { name: "title", type: "string" }
                        }
                    }
                }
            });
            const result = node.getSchema("#/image/title");
            assert(isSchemaNode(result));
            assert.deepEqual(result.schema, { name: "title", type: "string" });
        });

        it("should resolve $ref as property", () => {
            const node = compileSchema({
                type: "object",
                definitions: {
                    target: {
                        name: "target"
                    }
                },
                properties: {
                    image: {
                        $ref: "#/definitions/target"
                    }
                }
            }).getSchema("#/image");
            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, { name: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            const node = compileSchema({
                type: "object",
                additionalProperties: false,
                oneOf: [
                    {
                        type: "object",
                        properties: { first: { type: "string" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: {
                            second: { type: "string", name: "target" }
                        },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { third: { type: "string" } },
                        additionalProperties: false
                    }
                ]
            });
            const result = node.getSchema("#/second", { second: "string" });
            assert(isSchemaNode(result));
            assert.deepEqual(result.schema, { name: "target", type: "string" });
        });

        it("should return 'one-of-error' if enforced oneOf schema could not be resolved", () => {
            const oneOf = [
                {
                    type: "object",
                    properties: { second: { type: "string", name: "target" } },
                    additionalProperties: false
                }
            ];

            const error = compileSchema({
                type: "object",
                required: ["nested"],
                properties: {
                    nested: {
                        type: "object",
                        additionalProperties: false,
                        oneOf: [
                            {
                                type: "object",
                                properties: { second: { type: "string", name: "target" } },
                                additionalProperties: false
                            }
                        ]
                    }
                }
            }).getSchema("#/nested/second", { nested: { second: 123 } });

            assert(isJsonError(error), "should have returned an error");
            assert.deepEqual(error.code, "one-of-error");
            assert.deepEqual(error.data?.pointer, "#/nested/second", "it should expose location of error");
            assert.deepEqual(error.data?.schema.oneOf, oneOf, "should have exposed json-schema of error location");
            assert.deepEqual(error.data?.oneOf, oneOf, "should have exposed oneOf array on data");
        });

        it("should return only one-of schema is no data is given", () => {
            const node = compileSchema({
                type: "object",
                required: ["nested"],
                properties: {
                    nested: {
                        type: "object",
                        additionalProperties: false,
                        oneOf: [
                            {
                                type: "object",
                                properties: { second: { type: "string", name: "target" } },
                                additionalProperties: false
                            }
                        ]
                    }
                }
            }).getSchema("#/nested/second");
            assert(isSchemaNode(node), "should have returned valid node");
            assert.deepEqual(node.schema, { type: "string", name: "target" });
        });

        it("should return schema of matching patternProperty", () => {
            const node = compileSchema({
                type: "object",
                patternProperties: {
                    "^abc$": { type: "string" },
                    "^def$": { type: "number" }
                }
            });
            const result = node.getSchema("#/def");
            assert(isSchemaNode(result));
            assert.deepEqual(result.schema, { type: "number" });
        });

        it("should return an error if schema could not be resolved", () => {
            const node = compileSchema({
                type: "object",
                properties: { coffee: { type: "string" } },
                patternProperties: { "^tee$": { type: "string" } },
                additionalProperties: false
            });
            const result = node.getSchema("#/beer");
            assert(isJsonError(result));
            assert.deepEqual(result.name, "NoAdditionalPropertiesError");
        });

        describe("dependencies", () => {
            // it("should not return schema from dependencies when dependent property is missing", () => {
            //     const node = compileSchema({
            //         type: "object",
            //         properties: {
            //             test: { type: "string" }
            //         },
            //         dependencies: {
            //             test: {
            //                 properties: {
            //                     additionalValue: { type: "string" }
            //                 }
            //             }
            //         }
            //     });
            //     const result = node.getSchema("#/additionalValue");
            //     assert.deepEqual(schema.type,"error");
            // });
            it("should return schema from dependencies when dependent property is present", () => {
                const node = compileSchema({
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    dependencies: {
                        test: {
                            properties: {
                                additionalValue: { type: "string" }
                            }
                        }
                    }
                });
                const result = node.getSchema("/additionalValue", { test: "is defined" });
                assert.deepEqual(result.schema, { type: "string" });
            });
        });

        describe("if-then-else", () => {
            it("should return then-schema for matching if-schema", () => {
                const node = compileSchema({
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 1 }
                        }
                    },
                    then: {
                        properties: {
                            additionalValue: { description: "added", type: "string" }
                        }
                    }
                });

                const result = node.getSchema("/additionalValue", { test: "validates if" });
                assert.deepEqual(result.schema, { type: "string", description: "added" });
            });
            it("should return else-schema for non-matching if-schema", () => {
                const node = compileSchema({
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 1 }
                        }
                    },
                    then: {
                        properties: {
                            thenValue: { description: "then", type: "string" }
                        }
                    },
                    else: {
                        properties: {
                            elseValue: { description: "else", type: "string" }
                        }
                    }
                });

                const result = node.getSchema("/elseValue", { test: "" });
                assert.deepEqual(result.schema, { type: "string", description: "else" });
            });
            it("should return correct schema for duplicate property", () => {
                const node = compileSchema({
                    type: "object",
                    properties: {
                        test: { type: "string" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 1 }
                        }
                    },
                    then: {
                        properties: {
                            dynamicValue: { description: "then", type: "string" }
                        }
                    },
                    else: {
                        properties: {
                            dynamicValue: { description: "else", type: "string" }
                        }
                    }
                });

                const result = node.getSchema("/dynamicValue", { test: "" });
                assert.deepEqual(result.schema, { type: "string", description: "else" });
            });
        });
    });

    describe("array", () => {
        it("should return item schema", () => {
            const node = compileSchema({
                type: "array",
                items: { name: "title", type: "string" }
            });
            const result = node.getSchema("#/0");
            assert.deepEqual(result.schema, { name: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "number" }, { name: "target", type: "string" }, { type: "number" }]
            });
            const result = node.getSchema("#/1");
            assert.deepEqual(result.schema, { name: "target", type: "string" });
        });

        it.skip("should return schema for matching 'oneOf' item", () => {
            const node = compileSchema({
                type: "array",
                items: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { first: { type: "string" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: {
                                second: { type: "string", name: "target" }
                            },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { third: { type: "string" } },
                            additionalProperties: false
                        }
                    ]
                }
            }).getSchema("#/0/second", [{ second: "second" }]);
            assert.deepEqual(node.schema, { type: "string", name: "target" });
        });

        it("should return error if no matching 'oneOf' item was found", () => {
            const schema = {
                type: "array",
                items: {
                    type: "object",
                    additionalProperties: false,
                    oneOf: [
                        {
                            type: "object",
                            properties: { first: { type: "string" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: {
                                second: { type: "string", name: "target" }
                            },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { third: { type: "string" } },
                            additionalProperties: false
                        }
                    ]
                }
            };

            const node = compileSchema(schema);
            const error = node.getSchema("#/0/second", []);
            assert(isJsonError(error));
            assert.deepEqual(error.code, "one-of-error");
            assert.deepEqual(error.data.schema, schema.items, "should have exposed json-schema of error location");
            assert.deepEqual(error.data?.oneOf, schema.items.oneOf, "should have exposed oneOf array on data");
        });
    });
});
