import { expect } from "chai";
import { Draft07 as Draft } from "../../../lib/draft07";

describe("issue#57 - resolveAllOf mutates data", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft({
        "id": "animals",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "type": "object",
        "properties": {
            "horse": {
                "type": "string"
            },
            "dog": {
                "type": "string"
            },
            "lizards": {
                "minItems": 3,
                "type": "array",
                "items": {
                    "type": "string"
                }
            }
        },
        "allOf": [
            {
                "if": {
                    "properties": {
                        "horse": {
                            "const": ""
                        }
                    }
                },
                "then": {
                    "properties": {
                        "dog": {
                            "minLength": 1
                        }
                    }
                }
            }
        ]
    })));

    it("should not modify input data", () => {
        const inputData: { lizards: string[] } = { lizards: [] };
        draft.validate(inputData);

        expect(inputData).to.deep.equal({ lizards: [] });
    });

    it("should not throw an error with a frozen array", () => {
        const inputData: { lizards: readonly string[] } = { lizards: Object.freeze([]) };
        draft.validate(inputData);

        expect(inputData).to.deep.equal({ lizards: [] });
    });
});





