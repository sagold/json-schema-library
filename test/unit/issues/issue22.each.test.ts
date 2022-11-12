import { expect } from "chai";
import { Draft07 } from "../../../lib/draft07";

describe.only("issue#19 - getSchema from dependencies", () => {
    let draft: Draft07;
    beforeEach(() => {
        draft = new Draft07({
            $schema: "http://json-schema.org/draft-07/schema",
            $ref: "#/definitions/object1",
            definitions: {
                object1: {
                    type: "object",
                    required: ["prop1", "prop2"],
                    properties: {
                        prop1: {
                            type: "string"
                        },
                        prop2: {
                            type: "string"
                        }
                    }
                }
            }
        });
    });

    it("should call for each properties", () => {
        const calls: any[] = [];
        draft.each(
            {
                prop1: "foo",
                prop2: "foo"
            },
            (schema) => calls.push(schema)
        );

        expect(calls).to.have.length(3);
        expect(calls[0].type).to.deep.eq("object");
        expect(calls[1].type).to.deep.eq("string");
        expect(calls[2].type).to.deep.eq("string");
    });
});
