import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isJsonError, isSchemaNode } from "./types";
import { draftEditor } from "./draftEditor";

// - processing draft we need to know and support json-schema keywords
// - Note: meta-schemas are defined flat, combining all properties per type
// - parsing schemas under draft build functionality available for schema
// - building up available functionality has to be done for every root schema (if $vocabulary is set)
// import draft2019Root from "../../remotes/draft2019-09.json"; // defines general root-schema
// import draft2019Core from "../../remotes/draft2019-09_meta_core.json"; // $-keywords likle $ref, $id
// import draft2019Applicator from "../../remotes/draft2019-09_meta_applicator.json";

// import { mergeSchema } from "../mergeSchema";

// const simplifiedMetaSchema = {
//     $id: "https://json-schema.org/draft/2019-09/schema",
//     $vocabulary: {
//         "https://json-schema.org/draft/2019-09/vocab/core": true
//     },
//     $recursiveAnchor: true,
//     type: ["object", "boolean"],
//     properties: {
//         properties: {
//             type: "object",
//             additionalProperties: { $recursiveRef: "#" },
//             default: {}
//         }
//     }
// };

// const PARSER: Record<string, object> = {
//     properties: {}
// };

// function parse(schema: JsonSchema, metaSchema: JsonSchema, schemaPointer: string = "#") {
//     // use meta-schema to validate schema - or step-by-step parse schema while doing incremental validation
//     // 1. there are validation rules in meta-schema for given schema
//     // 2. while validating schema we need to
//     //  2a. abort if there are keywords we do not support and
//     //  2b. only add functionality that is defined by schema
//     // - doing this, we must reuse schema-logic for initial parsing, schema validation and utility functions
//     // - possibly optimize all this once for actual exection (compilation)
// }

describe("compileSchema templateDefaultOptions", () => {
    it("should apply `templateDefaultOptions.addOptionalProps` to getTemplate", () => {
        const schema = {
            properties: {
                type: { const: "node" },
                nodes: { items: { $ref: "#" } }
            }
        };

        let data = compileSchema(schema).getTemplate();
        assert.deepEqual(data, {});

        data = compileSchema(schema, { templateDefaultOptions: { addOptionalProps: true } }).getTemplate();
        assert.deepEqual(data, {
            type: "node",
            nodes: []
        });
    });

    it("should apply `templateDefaultOptions.recursiveLimit` to getTemplate", () => {
        const schema = {
            required: ["type", "nodes"],
            properties: {
                type: { const: "node" },
                nodes: { items: { $ref: "#" }, minItems: 1 }
            }
        };

        let data = compileSchema(schema).getTemplate();
        assert.deepEqual(data, {
            type: "node",
            nodes: [
                {
                    type: "node",
                    nodes: []
                }
            ]
        });

        data = compileSchema(schema, { templateDefaultOptions: { recursionLimit: 2 } }).getTemplate();
        assert.deepEqual(data, {
            type: "node",
            nodes: [
                {
                    type: "node",
                    nodes: [
                        {
                            type: "node",
                            nodes: []
                        }
                    ]
                }
            ]
        });
    });
});

describe("compileSchema `schemaId`", () => {
    // @todo maybe this should throw an error to catch unwanted behaviour
    it.skip("should return boolean schema true for undefined", () => {
        const node = compileSchema(undefined);
        assert.deepEqual(node.$id, "#");
        assert.deepEqual(node.schema, true);
    });

    it("should store path from rootSchema as schemaId", () => {
        const node = compileSchema({
            if: { type: "string" },
            then: { type: "string" },
            properties: { title: { type: "string" } },
            $defs: { asset: { type: "string" } }
        });

        assert.deepEqual(node.schemaId, "#");
        assert.deepEqual(node.if.schemaId, "#/if");
        assert.deepEqual(node.then.schemaId, "#/then");
        assert.deepEqual(node.properties.title.schemaId, "#/properties/title");
        assert.deepEqual(node.$defs.asset.schemaId, "#/$defs/asset");
    });

    it("should maintain schemaId when resolved by ref", () => {
        const node = compileSchema({
            properties: { title: { $ref: "#/$defs/asset" } },
            $defs: { asset: { type: "string" } }
        }).get("title");
        assert(isSchemaNode(node));
        // @todo should have returned already resolved node?
        const result = node.resolveRef();
        assert.deepEqual(result.schemaId, "#/$defs/asset");
    });

    it("should maintain schemaId when resolved by root-ref", () => {
        const node = compileSchema({
            properties: { title: { $ref: "#" } }
        }).get("title");
        assert(isSchemaNode(node));
        // @todo should have returned already resolved node?
        const result = node.resolveRef();
        assert.deepEqual(result.schemaId, "#");
    });
});

describe("compileSchema `errors`", () => {
    it("draftEditor come with custom minLengthOneError", () => {
        const errors = compileSchema(
            {
                type: "string",
                minLength: 1
            },
            { drafts: [draftEditor] }
        ).validate("");
        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].name, "MinLengthOneError");
    });
});
