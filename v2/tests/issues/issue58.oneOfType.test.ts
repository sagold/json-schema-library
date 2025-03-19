import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode, SchemaNode } from "../../types";

describe("issue#58 - oneOf should invalid type error", () => {
    it("should return one-of-error for invalid type", () => {
        const node = compileSchema({
            oneOf: [{ type: "null" }, { type: "number" }]
        });
        const errors = node.validate("string");
        assert(errors.length > 0);
    });

    it("should validate correct type defined in one-of statement", () => {
        const node = compileSchema({
            oneOf: [{ type: "null" }, { type: "number" }]
        });
        const errors = node.validate(123);
        assert(errors.length === 0);
    });

    it("should return type-error for non-integer value", () => {
        const node = compileSchema({
            properties: {
                foo: {
                    properties: {
                        number: {
                            type: "integer"
                        }
                    }
                }
            }
        });
        const errors = node.validate({ foo: { number: "not an integer" } });
        assert(errors.length > 0);
    });

    it("should return type-error for non-integer value in combination with oneOf", () => {
        const node = compileSchema({
            properties: {
                foo: {
                    properties: {
                        number: {
                            type: "integer"
                        }
                    },
                    oneOf: [
                        {
                            type: "null"
                        },
                        {
                            type: "object"
                        }
                    ]
                }
            }
        });
        const errors = node.validate({ foo: { number: "not an integer" } });
        assert(errors.length > 0);
    });

    it("should return type-error", () => {
        const schema = {
            $schema: "http://json-schema.org/draft-04/schema#",
            properties: {
                foo: {
                    additionalProperties: false,
                    properties: {
                        number: {
                            type: "integer"
                        }
                    },
                    oneOf: [
                        {
                            type: "null"
                        },
                        {
                            type: "object"
                        }
                    ]
                }
            },
            additionalProperties: false,
            oneOf: [
                {
                    type: "null"
                },
                {
                    type: "object"
                }
            ]
        };
        const inputData: {
            foo: { number: string };
        } = {
            foo: {
                number: "not an integer"
            }
        };

        const node = compileSchema(schema);
        const errors = node.validate(inputData);
        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "type-error");
    });

    it("should validate without type-error", () => {
        const schema = {
            $schema: "http://json-schema.org/draft-04/schema#",
            properties: {
                foo: {
                    additionalProperties: false,
                    properties: {
                        number: {
                            type: "integer"
                        }
                    },
                    oneOf: [
                        {
                            type: "null"
                        },
                        {
                            type: "object"
                        }
                    ]
                }
            },
            additionalProperties: false,
            oneOf: [
                {
                    type: "null"
                },
                {
                    type: "object"
                }
            ]
        };
        const inputData = {
            foo: {
                number: 123
            }
        };

        const node = compileSchema(schema);
        const errors = node.validate(inputData);
        assert.equal(errors.length, 0);
    });
});
