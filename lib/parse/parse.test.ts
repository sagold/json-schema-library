import { strict as assert } from "assert";
import { JsonSchema } from "../types";

// - processing draft we need to know and support json-schema keywords
// - Note: meta-schemas are defined flat, combining all properties per type
// - parsing schemas under draft build functionality available for schema
// - building up available functionality has to be done for every root schema (if $vocabulary is set)
import draft2019Root from "../../remotes/draft2019-09.json"; // defines general root-schema
import draft2019Core from "../../remotes/draft2019-09_meta_core.json"; // $-keywords likle $ref, $id
import draft2019Applicator from "../../remotes/draft2019-09_meta_applicator.json";

const simplifiedMetaSchema = {
    $id: "https://json-schema.org/draft/2019-09/schema",
    $vocabulary: {
        "https://json-schema.org/draft/2019-09/vocab/core": true
    },
    $recursiveAnchor: true,
    type: ["object", "boolean"],
    properties: {
        properties: {
            type: "object",
            additionalProperties: { $recursiveRef: "#" },
            default: {}
        }
    }
};

const PARSER: Record<string, object> = {
    properties: {}
};

function parse(schema: JsonSchema, metaSchema: JsonSchema, schemaPointer: string = "#") {
    // use meta-schema to validate schema - or step-by-step parse schema while doing incremental validation
    // 1. there are validation rules in meta-schema for given schema
    // 2. while validating schema we need to
    //  2a. abort if there are keywords we do not support and
    //  2b. only add functionality that is defined by schema
    // - doing this, we must reuse schema-logic for initial parsing, schema validation and utility functions
    // - possibly optimize all this once for actual exection (compilation)
}

describe("`parse` schema", () => {
    describe("properties", () => {
        it("should return a node containing child-nodes for each sub-schema", () => {});
    });
});
