import { expect } from "chai";
import getSchema from "../../lib/getSchema";
import { JsonEditor as Core } from "../../lib/jsoneditor";

describe("getSchema", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    describe("value", () => {
        it("should return schema of any value", () => {
            draft.setSchema({ name: "target", type: "*" });
            const schema = getSchema(draft, "#");
            expect(schema).to.deep.include({ name: "target", type: "*" });
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
            const schema = getSchema(draft, "#/value", { value: 123 });
            expect(schema).to.deep.include({ name: "target", type: "number" });
        });
    });

    describe("object", () => {
        it("should return schema of the given property", () => {
            draft.setSchema({
                type: "object",
                properties: {
                    title: { name: "title", type: "string" }
                }
            });
            const schema = getSchema(draft, "#/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
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
            const schema = getSchema(draft, "#/image/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
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
            const schema = getSchema(draft, "#/image");
            expect(schema).to.deep.include({ name: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            draft.setSchema({
                type: "object",
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
            const schema = getSchema(draft, "#/second", { second: "string" });
            expect(schema).to.deep.include({ name: "target", type: "string" });
        });

        it("should return schema of matching patternProperty", () => {
            draft.setSchema({
                type: "object",
                patternProperties: {
                    "^abc$": { type: "string" },
                    "^def$": { type: "number" }
                }
            });
            const schema = getSchema(draft, "#/def");
            expect(schema).to.deep.include({ type: "number" });
        });

        it("should return an error if schema could not be resolved", () => {
            draft.setSchema({
                type: "object",
                properties: { coffee: { type: "string" } },
                patternProperties: { "^tee$": { type: "string" } },
                additionalProperties: false
            });
            const schema = getSchema(draft, "#/beer");
            expect(schema.name).to.equal("UnknownPropertyError");
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
            //     const schema = getSchema(draft, "#/additionalValue");
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
                const schema = getSchema(draft, "/additionalValue", { test: "is defined" });
                expect(schema).to.deep.include({ type: "string" });
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

                const schema = getSchema(draft, "/additionalValue", { test: "validates if" });
                expect(schema).to.deep.include({ type: "string", description: "added" });
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

                const schema = getSchema(draft, "/elseValue", { test: "" });
                expect(schema).to.deep.include({ type: "string", description: "else" });
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

                const schema = getSchema(draft, "/dynamicValue", { test: "" });
                expect(schema).to.deep.include({ type: "string", description: "else" });
            });
        });
    });

    describe("array", () => {
        it("should return item schema", () => {
            draft.setSchema({
                type: "array",
                items: { name: "title", type: "string" }
            });
            const schema = getSchema(draft, "#/0");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "number" }, { name: "target", type: "string" }, { type: "number" }]
            });
            const schema = getSchema(draft, "#/1");
            expect(schema).to.deep.include({ name: "target", type: "string" });
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
            const schema = getSchema(draft, "#/0/second", [{ second: "second" }]);
            expect(schema).to.deep.include({ type: "string", name: "target" });
        });
    });
});
