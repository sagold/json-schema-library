import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { SchemaNode } from "../../types";

describe("issue#57 - resolveAllOf mutates data", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
            id: "animals",
            $schema: "http://json-schema.org/draft-04/schema#",
            type: "object",
            properties: {
                horse: {
                    type: "string"
                },
                dog: {
                    type: "string"
                },
                lizards: {
                    minItems: 3,
                    type: "array",
                    items: {
                        type: "string"
                    }
                }
            },
            allOf: [
                {
                    if: {
                        properties: {
                            horse: {
                                const: ""
                            }
                        }
                    },
                    then: {
                        properties: {
                            dog: {
                                minLength: 1
                            }
                        }
                    }
                }
            ]
        });
    });

    it("should not modify input data", () => {
        const inputData: { lizards: string[] } = { lizards: [] };
        node.validate(inputData);

        assert.deepEqual(inputData, { lizards: [] });
    });

    it("should not throw an error with a frozen array", () => {
        const inputData: { lizards: readonly string[] } = { lizards: Object.freeze([]) };
        node.validate(inputData);

        assert.deepEqual(inputData, { lizards: [] });
    });
});
