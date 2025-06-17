import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema.js";
import { SchemaNode } from "../../types.js";

describe("issue#52 - mutiple typeIds [not, oneOf] matched in subschema", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
            $schema: "draft-04",
            description: "Schema and content are mutually exclusive, at least one is required",
            not: {
                required: ["schema", "content"]
            },
            oneOf: [
                {
                    required: ["schema"]
                },
                {
                    required: ["content"],
                    description: "Some properties are not allowed if content is present",
                    allOf: [
                        {
                            not: {
                                required: ["style"]
                            }
                        },
                        {
                            not: {
                                required: ["explode"]
                            }
                        },
                        {
                            not: {
                                required: ["allowReserved"]
                            }
                        },
                        {
                            not: {
                                required: ["example"]
                            }
                        },
                        {
                            not: {
                                required: ["examples"]
                            }
                        }
                    ]
                }
            ]
        });
    });

    it("should return validation error for prohibited property example", () => {
        const { errors } = node.validate({ content: "required", example: "invalid" });
        assert.deepEqual(errors.length, 1);
    });
});
