import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { SchemaNode } from "../../types";

describe("issue#44 - chained negative logic", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
            type: "object",
            properties: {
                animal_species: {
                    enum: ["cat", "eagle"]
                },
                diet_type: {
                    enum: ["carnivore", "omnivore"]
                },
                habitat_type: {
                    enum: ["forest", "mountain"]
                }
            },
            allOf: [
                {
                    if: {
                        not: {
                            properties: {
                                animal_species: { const: "cat" }
                            }
                        }
                    },
                    then: {
                        properties: {
                            diet_type: { const: "carnivore" }
                        }
                    }
                },
                {
                    if: {
                        not: {
                            properties: {
                                diet_type: { const: "carnivore" },
                                animal_species: { const: "cat" }
                            }
                        }
                    },
                    then: {
                        properties: {
                            habitat_type: { const: "mountain" }
                        }
                    }
                }
            ]
        });
    });

    it("should validate input data", () => {
        const errors = node.validate({
            animal_species: "cat",
            diet_type: "omnivore",
            habitat_type: "mountain"
        });

        assert.deepEqual(errors.length, 0);
    });
});
