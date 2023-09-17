import { expect } from "chai";
import { Draft07 as Draft } from "../../../lib/draft07";

describe("issue#44 - chained negative logic", () => {
    let draft: Draft;
    beforeEach(() => {
        draft = new Draft({
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
        const errors = draft.validate({
            animal_species: "cat",
            diet_type: "omnivore",
            habitat_type: "mountain"
        });

        expect(errors).to.have.length(0);
    });
});
