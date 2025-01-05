import { strict as assert } from "assert";
import { Draft07 } from "../../../lib/draft07";
import { Draft2019 } from "../../../lib/draft2019";
import { JsonSchema } from "../../../lib/types";
import compileSchema from "../../../lib/compile";

describe("issue#64 - should not fail compiling schema", () => {
    let draft: Draft07;
    let schema: JsonSchema;
    beforeEach(() => {
        draft = new Draft07();
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

    it("should not fail compiling schema from draft", () => {
        const result = draft.compileSchema(schema);
        assert(typeof result.$schema === "string");
        assert.equal(result.$schema, schema.$schema);
    });

    it("should not fail compiling schema", () => {
        const result = compileSchema(new Draft07(), schema);
        assert(typeof result.$schema === "string");
        assert.equal(result.$schema, schema.$schema);
    });

    it("should not fail compiling schema for draft2019", () => {
        const result = compileSchema(new Draft2019(), schema);
        assert(typeof result.$schema === "string");
        assert.equal(result.$schema, schema.$schema);
    });
});
