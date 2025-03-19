import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { SchemaNode } from "../../types";

describe("issue#32 - getTemplate ignored input data for integer", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
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
        const result = node.getTemplate({
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

        assert.deepEqual(result, {
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
