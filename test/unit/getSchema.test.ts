import { strict as assert } from "assert";
import { expect } from "chai";
import getSchema from "../../lib/getSchema";
import { JsonEditor as Core } from "../../lib/jsoneditor";
import { isJsonError } from "../../lib/types";
import { isSchemaNode } from "../../lib/schemaNode";

describe("getSchema", () => {
    let draft: Core;
    beforeEach(() => (draft = new Core()));

    describe("value", () => {
        it("should return schema of any value", () => {
            draft.setSchema({ name: "target", type: "*" });
            const result = getSchema(draft, { pointer: "#" });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "target", type: "*" });
        });

        it("should resolve property through root $ref", () => {
            draft.setSchema({
                $ref: "#/$defs/root",
                $defs: {
                    root: {
                        type: "object",
                        properties: {
                            value: { type: "number", name: "target" }
                        }
                    }
                }
            });
            const result = getSchema(draft, { pointer: "#/value", data: { value: 123 } });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "target", type: "number" });
        });
    });

    describe("object", () => {
        it("should return schema of valid property", () => {
            draft.setSchema({
                type: "object",
                properties: {
                    title: { name: "title", type: "string" }
                }
            });
            const result = getSchema(draft, { pointer: "#/title" });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should return `schema-warning` for unknown, but valid property", () => {
            draft.setSchema({ type: "object" });
            const result = getSchema(draft, { pointer: "#/title", withSchemaWarning: true });
            assert(isJsonError(result));
            expect(result).to.deep.include({ code: "schema-warning", type: "error" });
        });

        it("should return `undefined` for unknown, but valid property", () => {
            draft.setSchema({ type: "object" });
            const result = getSchema(draft, { pointer: "#/title" });
            assert(isSchemaNode(result));
            expect(result.schema).to.eq(undefined);
        });

        it("should return schema for unknown property if data is passed", () => {
            draft.setSchema({ type: "object" });
            const result = getSchema(draft, { pointer: "#/title", data: { title: "value" } });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ type: "string" });
        });

        it("should return an error for invalid properties", () => {
            // with additionalProperties=false, the requested property is invalid
            draft.setSchema({
                type: "object",
                properties: { title: { type: "string" } },
                additionalProperties: false
            });
            const result = getSchema(draft, { pointer: "#/unknown" });
            assert(isJsonError(result));
            expect(result).to.deep.include({
                code: "unknown-property-error",
                type: "error"
            });
        });

        it("should return an error for invalid properties, even if value is given", () => {
            // with additionalProperties=false, the requested property is invalid
            draft.setSchema({
                type: "object",
                properties: { title: { type: "string" } },
                additionalProperties: false
            });
            const result = getSchema(draft, {
                pointer: "#/unknown",
                data: { unknown: "value" }
            });
            assert(isJsonError(result));
            expect(result).to.deep.include({
                code: "unknown-property-error",
                type: "error"
            });
        });

        it("should return schema for property within nested object", () => {
            draft.setSchema({
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
            const result = getSchema(draft, { pointer: "#/image/title" });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should resolve $ref as property", () => {
            draft.setSchema({
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
            });
            const result = getSchema(draft, { pointer: "#/image" });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            draft.setSchema({
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
            const result = getSchema(draft, {
                pointer: "#/second",
                data: { second: "string" }
            });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ name: "target", type: "string" });
        });

        it("should return 'one-of-error' if enforced oneOf schema could not be resolved", () => {
            // requires additionalProperties=false
            const schema = {
                type: "object",
                required: ["nested"],
                properties: {
                    nested: {
                        type: "object",
                        additionalProperties: false,
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    second: { type: "string", name: "target" }
                                },
                                additionalProperties: false
                            }
                        ]
                    }
                }
            };
            draft.setSchema(schema);
            const result = getSchema(draft, { pointer: "#/nested/second" });
            // console.log("result", result);
            assert(isJsonError(result));
            expect(result.code).to.eq("one-of-error");
            expect(result.data?.pointer).to.equal("#/nested", "it should expose location of error");
            expect(result.data?.schema.oneOf).to.deep.equal(
                schema.properties.nested.oneOf,
                "should have exposed json-schema of error location"
            );
            expect(result.data?.oneOf).to.deep.equal(
                schema.properties.nested.oneOf,
                "should have exposed oneOf array on data"
            );
        });

        it("should return schema of matching patternProperty", () => {
            draft.setSchema({
                type: "object",
                patternProperties: {
                    "^abc$": { type: "string" },
                    "^def$": { type: "number" }
                }
            });
            const result = getSchema(draft, { pointer: "#/def" });
            assert(isSchemaNode(result));
            expect(result.schema).to.deep.include({ type: "number" });
        });

        it("should return an error if schema could not be resolved", () => {
            draft.setSchema({
                type: "object",
                properties: { coffee: { type: "string" } },
                patternProperties: { "^tee$": { type: "string" } },
                additionalProperties: false
            });
            const result = getSchema(draft, { pointer: "#/beer" });
            assert(isJsonError(result));
            expect(result.name).to.equal("UnknownPropertyError");
        });

        describe("dependencies", () => {
            // it("should not return schema from dependencies when dependent property is missing", () => {
            //     draft.setSchema({
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
            //     const result = getSchema(draft, "#/additionalValue");
            //     expect(schema.type).to.equal("error");
            // });
            it("should return schema from dependencies when dependent property is present", () => {
                draft.setSchema({
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
                const result = getSchema(draft, {
                    pointer: "/additionalValue",
                    data: { test: "is defined" }
                });
                expect(result.schema).to.deep.include({ type: "string" });
            });
        });

        describe("if-then-else", () => {
            it("should return then-schema for matching if-schema", () => {
                draft.setSchema({
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

                const result = getSchema(draft, {
                    pointer: "/additionalValue",
                    data: { test: "validates if" }
                });
                expect(result.schema).to.deep.include({ type: "string", description: "added" });
            });
            it("should return else-schema for non-matching if-schema", () => {
                draft.setSchema({
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

                const result = getSchema(draft, { pointer: "/elseValue", data: { test: "" } });
                expect(result.schema).to.deep.include({ type: "string", description: "else" });
            });
            it("should return correct schema for duplicate property", () => {
                draft.setSchema({
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

                const result = getSchema(draft, {
                    pointer: "/dynamicValue",
                    data: { test: "" }
                });
                expect(result.schema).to.deep.include({ type: "string", description: "else" });
            });
        });
    });

    describe("array", () => {
        it("should return item schema", () => {
            draft.setSchema({
                type: "array",
                items: { name: "title", type: "string" }
            });
            const result = getSchema(draft, { pointer: "#/0" });
            expect(result.schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "number" }, { name: "target", type: "string" }, { type: "number" }]
            });
            const result = getSchema(draft, { pointer: "#/1" });
            expect(result.schema).to.deep.include({ name: "target", type: "string" });
        });

        it("should return schema for matching 'oneOf' item", () => {
            draft.setSchema({
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
            });
            const result = getSchema(draft, {
                pointer: "#/0/second",
                data: [{ second: "second" }]
            });
            expect(result.schema).to.deep.include({ type: "string", name: "target" });
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

            draft.setSchema(schema);
            const error = getSchema(draft, { pointer: "#/0/second", data: [] });
            assert(isJsonError(error));
            expect(error.code).to.eq("one-of-error");
            expect(error.data.schema).to.deep.include(
                schema.items,
                "should have exposed json-schema of error location"
            );
            expect(error.data?.oneOf).to.deep.equal(
                schema.items.oneOf,
                "should have exposed oneOf array on data"
            );
        });
    });
});
