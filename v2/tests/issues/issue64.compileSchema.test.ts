import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { JsonSchema } from "../../../lib/types";

describe("issue#64 - should not fail compiling schema", () => {
    let schema: JsonSchema;
    beforeEach(() => {
        schema = {
            $ref: "#/definitions/test",
            definitions: {
                test: {
                    type: "object",
                    properties: {
                        properties: {
                            type: "array",
                            items: {
                                anyOf: [
                                    {
                                        type: "object",
                                        properties: {
                                            something: {
                                                type: "string"
                                            }
                                        }
                                    },
                                    {
                                        type: "object",
                                        properties: {
                                            items: {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        id: {
                                                            type: "string"
                                                        },
                                                        properties: {
                                                            type: "array",
                                                            items: {
                                                                $ref: "#/definitions/test/properties/properties/items/anyOf/0"
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            $schema: "http://json-schema.org/draft-07/schema#"
        };
    });

    it("should not fail compiling schema using latest draft", () => {
        const node = compileSchema(schema);
        assert(typeof node.schema.$schema === "string");
        assert.deepEqual(node.schema, schema);
    });

    it("should not fail compiling schema using draft-07", () => {
        const d7 = {
            ...schema,
            $schema: "draft-07"
        };
        const node = compileSchema(d7);
        assert.equal(node.context.VERSION, "draft-07");
        assert.deepEqual(node.schema, d7);
    });

    it("should not fail compiling schema for draft-04", () => {
        const d4 = {
            ...schema,
            $schema: "draft-04"
        };
        const node = compileSchema(d4);
        assert.equal(node.context.VERSION, "draft-04");
        assert.deepEqual(node.schema, d4);
    });
});
