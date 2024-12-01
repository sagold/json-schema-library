import { expect } from "chai";
import { Draft07 } from "../../../lib/draft07";
import { JsonSchema, JsonError, JsonPointer } from "../../../lib/types";
import draft7Schema from "../../../remotes/draft07.json";

describe("docs", () => {
    describe("draft methods", () => {
        it("validate should return error", () => {
            // import { Draft07, JsonSchema, JsonError } from "json-schema-library";
            const myJsonSchema: JsonSchema = {
                type: "object",
                additionalProperties: false
            };

            const jsonSchema = new Draft07(myJsonSchema);
            const errors: JsonError[] = jsonSchema.validate({ name: "my-data" });

            expect(errors[0]).to.deep.include({
                type: "error",
                name: "NoAdditionalPropertiesError",
                code: "no-additional-properties-error",
                message: "Additional property `name` in `#` is not allowed",
                data: {
                    value: { name: "my-data" },
                    schema: myJsonSchema,
                    property: "name",
                    properties: [],
                    pointer: "#"
                }
            });
        });
        it("validate should return error for separate schema", () => {
            // import { Draft07, JsonSchema, JsonError } from "json-schema-library";

            const myJsonSchema: JsonSchema = {
                type: "object",
                additionalProperties: false
            };

            const jsonSchema = new Draft07(myJsonSchema);
            const mySchema = jsonSchema.compileSchema({ type: "number" });
            const errors: JsonError[] = jsonSchema.validate("my-string", mySchema);

            expect(errors).to.deep.equal([
                {
                    type: "error",
                    name: "TypeError",
                    code: "type-error",
                    message: "Expected `my-string` (string) in `#` to be of type `number`",
                    data: {
                        received: "string",
                        expected: "number",
                        value: "my-string",
                        pointer: "#",
                        schema: mySchema
                    }
                }
            ]);
        });
        it("should return data using 'getTemplate'", () => {
            // import { Draft07, JsonSchema } from "json-schema-library";
            const myJsonSchema: JsonSchema = {
                type: "object",
                required: ["name", "option", "list"],
                properties: {
                    name: { type: "string" },
                    option: {
                        type: "string",
                        enum: ["first-option", "second-option"]
                    },
                    list: {
                        type: "array",
                        items: {
                            type: "string",
                            default: "new item"
                        },
                        minItems: 1
                    }
                }
            };

            const jsonSchema = new Draft07(myJsonSchema);
            const myData = jsonSchema.getTemplate();

            expect(myData).to.deep.equal({
                name: "",
                option: "first-option",
                list: ["new item"]
            });
        });
        it("should complement data using 'getTemplate'", () => {
            // import { Draft07, JsonSchema } from "json-schema-library";
            const myJsonSchema: JsonSchema = {
                type: "object",
                required: ["name", "option", "list"],
                properties: {
                    name: { type: "string" },
                    option: {
                        type: "string",
                        enum: ["first-option", "second-option"]
                    },
                    list: {
                        type: "array",
                        items: {
                            type: "string",
                            default: "new item"
                        },
                        minItems: 1
                    }
                }
            };

            const jsonSchema = new Draft07(myJsonSchema);
            const myData = jsonSchema.getTemplate({ name: "input-data", list: [] });

            expect(myData).to.deep.equal({
                name: "input-data",
                option: "first-option",
                list: ["new item"]
            });
        });
        it("should call for each data point using 'each", () => {
            // import { Draft07, JsonSchema, JsonPointer } from "json-schema-library";

            const mySchema: JsonSchema = {
                type: "array",
                items: [{ type: "number" }, { type: "string" }]
            };

            const jsonSchema = new Draft07(mySchema);
            const calls: Record<string, unknown>[] = [];
            const myCallback = (schema: JsonSchema, value: unknown, pointer: JsonPointer) => {
                calls.push({ schema, value, pointer });
            };

            jsonSchema.each([5, "nine"], myCallback);

            expect(calls).to.deep.equal([
                { schema: mySchema, value: [5, "nine"], pointer: "#" },
                { schema: { type: "number" }, value: 5, pointer: "#/0" },
                { schema: { type: "string" }, value: "nine", pointer: "#/1" }
            ]);
        });
        it("should call for each sub schema", () => {
            // import { Draft07, JsonSchema } from "json-schema-library";

            const mySchema: JsonSchema = {
                type: "array",
                items: {
                    oneOf: [{ type: "number" }, { $ref: "#/$defs/value" }]
                },
                $defs: {
                    value: { type: "string" },
                    object: { type: "object" }
                }
            };

            const jsonSchema = new Draft07(mySchema);
            const calls: Record<string, unknown>[] = [];
            const myCallback = (schema: JsonSchema) => {
                calls.push(schema);
            };

            jsonSchema.eachSchema(myCallback);

            expect(calls).to.deep.equal([
                mySchema,
                { oneOf: [{ type: "number" }, { $ref: "#/$defs/value" }] },
                { type: "number" },
                { $ref: "#/$defs/value" },
                { type: "string" },
                { type: "object" }
            ]);
        });
        it("should resolve oneOf item using 'getSchema'", () => {
            // import { Draft07, JsonSchema, JsonError } from "json-schema-library";
            const mySchema = {
                type: "object",
                properties: {
                    list: {
                        type: "array",
                        items: {
                            oneOf: [
                                {
                                    type: "object",
                                    required: ["name"],
                                    properties: {
                                        name: {
                                            type: "string",
                                            title: "name of item"
                                        }
                                    }
                                },
                                {
                                    type: "object",
                                    required: ["description"],
                                    properties: {
                                        description: {
                                            type: "string",
                                            title: "description of item"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            };

            const jsonSchema = new Draft07(mySchema);
            const schemaOfItem: JsonSchema | JsonError | undefined = jsonSchema.getSchema({
                pointer: "/list/1",
                data: {
                    list: [{ description: "..." }, { name: "my-item" }]
                }
            });

            expect(schemaOfItem).to.deep.equal({
                type: "object",
                required: ["name"],
                __oneOfIndex: 0,
                properties: {
                    name: {
                        type: "string",
                        title: "name of item"
                    }
                }
            });
        });
        it("should resolve from remote schema", () => {
            const jsonSchema = new Draft07({
                $ref: "http://ohmy/schema#definitions/nonNegativeInteger"
            });
            jsonSchema.addRemoteSchema("http://ohmy/schema", draft7Schema);

            const schema = jsonSchema.getSchema();
            expect(schema).to.deep.equal({ type: "integer", minimum: 0 });
        });
    });
});
