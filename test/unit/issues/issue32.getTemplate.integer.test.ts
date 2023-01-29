import { expect } from "chai";
import { Draft04 } from "../../../lib/draft04";

describe("issue#32 - getTemplate ignored input data for integer", () => {
    let draft: Draft04;
    beforeEach(() => {
        draft = new Draft04({
            type: "object",
            properties: {
                id: {
                    type: "string"
                },
                title: {
                    type: "string"
                },
                students: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: {
                                type: "string"
                            },
                            age: {
                                type: "integer"
                            }
                        }
                    }
                }
            }
        });
    });

    it("should not override input data", () => {
        const result = draft.getTemplate({
            id: "4235809c-bdc7-46c5-be3d-b1b679bb1c13",
            title: "JavaScript Data Structures 101",
            students: [
                {
                    name: "Phil",
                    age: 31
                },
                {
                    name: "Irina",
                    age: 27
                }
            ]
        });

        expect(result).to.deep.equal({
            id: "4235809c-bdc7-46c5-be3d-b1b679bb1c13",
            title: "JavaScript Data Structures 101",
            students: [
                {
                    name: "Phil",
                    age: 31
                },
                {
                    name: "Irina",
                    age: 27
                }
            ]
        });
    });
});
