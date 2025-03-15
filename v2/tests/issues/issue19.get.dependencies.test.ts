import { strict as assert } from "assert";
// import { resolveOneOfFuzzy } from "../../../lib/features/oneOf";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode, SchemaNode } from "../../types";

describe("issue#19 - getSchema from dependencies", () => {
    let rootNode: SchemaNode;
    beforeEach(
        () =>
            (rootNode = compileSchema({
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
            }))
    );

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

    it.skip("should return correct schema for missing data property 'customField'", () => {
        // strict oneOf resolution will fail here, so we need to either fuzzy resolve oneOf item or
        // directly set "oneOfProperty" to "generation"
        // -> validate schema -> no schema is valid (because gneration is missing here)
        // => tell jlib which schema to resolve or let it retrieve a schema on its own

        // @todo
        // draft.resolveOneOf = function resolveOneOf(node: SchemaNode, data) {
        //     return resolveOneOfFuzzy(node, data);
        // };

        const node = rootNode.get("customField", {
            name: "issue #19",
            generation: "Display Custom Field"
        });

        assert.deepEqual(node.schema, {
            title: "Custom Field",
            type: "string"
        });
    });
});
