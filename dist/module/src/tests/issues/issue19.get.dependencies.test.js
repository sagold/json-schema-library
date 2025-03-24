import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode } from "../../types";
import { draft2019 } from "../../draft2019";
import { reduceOneOfFuzzy } from "../../features/oneOf";
describe("issue#19 - getSchema from dependencies", () => {
    let rootNode;
    beforeEach(() => (rootNode = compileSchema({
        $schema: "draft-06",
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
    })));
    it("should return correct schema for existing data property 'customField'", () => {
        const node = rootNode.get("customField", {
            name: "issue #19",
            generation: "Display Custom Field",
            customField: "mi"
        });
        assert(isSchemaNode(node), "should have return valid SchemaNode");
        assert.deepEqual(node.schema, {
            title: "Custom Field",
            type: "string"
        });
    });
    it("should return correct schema for missing data property 'customField'", () => {
        // strict oneOf resolution will fail here, so we need to either fuzzy resolve oneOf item or
        // directly set "oneOfProperty" to "generation"
        // @todo this is a lot of work
        const oneOfFeature = draft2019.features.findIndex((feat) => feat.keyword === "oneOf");
        assert(!isNaN(oneOfFeature));
        const features = [...draft2019.features];
        features[oneOfFeature] = {
            ...features[oneOfFeature],
            reduce: reduceOneOfFuzzy
        };
        const modifiedRootNode = compileSchema(rootNode.schema, {
            drafts: [
                {
                    regexp: ".",
                    draft: {
                        version: "draft-2019-09",
                        features
                    }
                }
            ]
        });
        const node = modifiedRootNode.get("customField", {
            name: "issue #19",
            generation: "Display Custom Field"
        });
        assert.deepEqual(node.schema, {
            title: "Custom Field",
            type: "string"
        });
    });
});
