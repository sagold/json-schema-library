import { expect } from "chai";
import getSchema from "../../../lib/getSchema";
import { Draft04 as Core } from "../../../lib/draft04";
import { JsonSchema, JsonPointer } from "../../../lib/types";
import { resolveOneOfFuzzy } from "../../../lib/features/oneOf";

describe("issue#19 - getSchema from dependencies", () => {
    let core: Core;
    beforeEach(
        () =>
            (core = new Core({
                title: "Fill in some steps",
                required: ["name"],
                properties: {
                    name: {
                        title: "Name",
                        type: "string",
                        description: "Unique name of the component"
                    },
                    generation: {
                        type: "string",
                        title: "Generation Method",
                        enum: ["Hide Custom Field", "Display Custom Field"],
                        default: "Hide Custom Field"
                    }
                },
                dependencies: {
                    generation: {
                        // oneOfProperty: "generation",
                        oneOf: [
                            {
                                properties: {
                                    generation: {
                                        const: "Hide Custom Field"
                                    }
                                }
                            },
                            {
                                required: ["customField"],
                                properties: {
                                    generation: {
                                        const: "Display Custom Field"
                                    },
                                    customField: {
                                        title: "Custom Field",
                                        type: "string"
                                    }
                                }
                            }
                        ]
                    }
                }
            }))
    );

    it("should return correct schema for existing data property 'customField'", () => {
        const schema = getSchema(core, "#/customField", {
            name: "issue #19",
            generation: "Display Custom Field",
            customField: "mi"
        });

        expect(schema).to.deep.equal({
            title: "Custom Field",
            type: "string"
        });
    });

    it("should return correct schema for missing data property 'customField'", () => {
        // strict oneOf resolution will fail here, so we need to either fuzzy resolve oneOf item or
        // directly set "oneOfProperty" to "generation"
        // -> validate schema -> no schema is valid (because gneration is missing here)
        // => tell jlib which schema to resolve or let it retrieve a schema on its own
        core.resolveOneOf = function resolveOneOf(data, schema: JsonSchema, pointer: JsonPointer) {
            return resolveOneOfFuzzy(this, data, schema, pointer);
        };

        const schema = getSchema(core, "#/customField", {
            name: "issue #19",
            generation: "Display Custom Field"
        });

        expect(schema).to.deep.equal({
            title: "Custom Field",
            type: "string"
        });
    });
});
