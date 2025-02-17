import { strict as assert } from "assert";
import { JsonSchema } from "../types";
import { Draft2019 } from "../draft2019";

// - processing draft we need to know and support json-schema keywords
// - Note: meta-schemas are defined flat, combining all properties per type
// - parsing schemas under draft build functionality available for schema
// - building up available functionality has to be done for every root schema (if $vocabulary is set)
import draft2019Root from "../../remotes/draft2019-09.json"; // defines general root-schema
import draft2019Core from "../../remotes/draft2019-09_meta_core.json"; // $-keywords likle $ref, $id
import draft2019Applicator from "../../remotes/draft2019-09_meta_applicator.json";
import { Draft } from "../draft";
import { mergeSchema } from "../mergeSchema";

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

import { compileSchema } from "./compileSchema";

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

describe.only("compiled object schema", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    describe("properties", () => {
        it("should step into properties without data", () => {
            const node = compileSchema(draft, {
                type: "object",
                properties: {
                    header: { type: "string", minLength: 1 }
                }
            });

            const schema = node.get("header")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should step into properties", () => {
            const node = compileSchema(draft, {
                type: "object",
                properties: {
                    header: { type: "string", minLength: 1 }
                }
            });

            const schema = node.get("header", { header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should step into nested properties", () => {
            const node = compileSchema(draft, {
                type: "object",
                properties: {
                    header: {
                        type: "object",
                        properties: {
                            title: { type: "string", minLength: 1 }
                        }
                    }
                }
            });

            const schema = node.get("header", { header: { title: "huhu" } }).get("title")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should step into properties with if-then present", () => {
            const node = compileSchema(draft, {
                type: "object",
                properties: {
                    withHeader: { type: "boolean", default: true }
                },
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
            });

            const schema = node.get("withHeader", { withHeader: false })?.schema;

            assert.deepEqual(schema, { type: "boolean", default: true });
        });
    });

    describe("additionalProperties", () => {
        it("should step into additionalProperties", () => {
            const node = compileSchema(draft, {
                type: "object",
                additionalProperties: { type: "string", minLength: 1 }
            });

            const schema = node.get("header", { header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should NOT step into additionalProperties if false", () => {
            const node = compileSchema(draft, {
                type: "object",
                additionalProperties: false
            });

            const schema = node.get("header", { header: "huhu" })?.schema;

            assert.deepEqual(schema, undefined);
        });

        it("should create a schema if additionalProperties is true", () => {
            const node = compileSchema(draft, {
                type: "object",
                additionalProperties: true
            });

            const schema = node.get("header", { header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string" });
        });

        it("should apply additionalProperties from allOf", () => {
            const node = compileSchema(draft, {
                type: "object",
                allOf: [
                    {
                        additionalProperties: true
                    }
                ]
            });

            const schema = node.get("header", { header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string" });
        });

        it("should override additionalProperties from allOf", () => {
            const node = compileSchema(draft, {
                type: "object",
                additionalProperties: { type: "number" },
                allOf: [
                    {
                        additionalProperties: { type: "boolean" }
                    }
                ]
            });

            const schema = node.get("header")?.schema;

            assert.deepEqual(schema, { type: "boolean" });
        });
    });

    describe("if-then-else", () => {
        it("should step into if-then-property", () => {
            const node = compileSchema(draft, {
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
            });

            const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should NOT step into if-then-property", () => {
            const node = compileSchema(draft, {
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } },
                additionalProperties: false
            });

            const schema = node.get("header", { withHeader: false, header: "huhu" })?.schema;

            assert.deepEqual(schema, undefined);
        });

        it("should step into if-else-property", () => {
            const node = compileSchema(draft, {
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                else: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
            });

            const schema = node.get("header", { withHeader: false, header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should recursively resolve if-then-else schema", () => {
            const node = compileSchema(draft, {
                type: "object",
                if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                then: { allOf: [{ required: ["header"], properties: { header: { type: "string", minLength: 1 } } }] }
            });

            const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });

    describe("allOf", () => {
        it("should step into allOf-property", () => {
            const node = compileSchema(draft, {
                type: "object",
                allOf: [{ properties: { header: { type: "string", minLength: 1 } } }]
            });

            const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });

        it("should recursively resolve allOf schema", () => {
            const node = compileSchema(draft, {
                type: "object",
                allOf: [
                    {
                        if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                        then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
                    }
                ]
            });

            const schema = node.get("header", { withHeader: true, header: "huhu" })?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});
