import { strict as assert } from "assert";
import { Draft2019 } from "../lib/draft2019";
import { Draft } from "../lib/draft";

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

describe("compiled object schema - get", () => {
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

    it("should should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema(draft, {
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            },
            allOf: [{ required: ["date"], properties: { date: { type: "string", format: "date" } } }]
        });

        const schema = node.reduce({ data: { withHeader: true, header: "huhu" } })?.schema;

        assert.deepEqual(schema, {
            type: "object",
            required: ["header", "date"],
            properties: {
                header: { type: "string", minLength: 1 },
                date: { type: "string", format: "date" }
            }
        });
    });

    describe("ref", () => {
        it("should resolve references in allOf schema", () => {
            const node = compileSchema(draft, {
                definitions: {
                    object: { type: "object" },
                    additionalNumber: {
                        additionalProperties: { type: "number", minLength: 2 }
                    }
                },
                allOf: [{ $ref: "#/definitions/object" }, { $ref: "#/definitions/additionalNumber" }]
            });

            const schema = node.get("title", { title: 4, test: 2 })?.schema;

            assert.deepEqual(schema, { type: "number", minLength: 2 });
        });
    });
});

describe("compiled items schema - get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    describe("items-object", () => {
        it("should step into items without data", () => {
            const node = compileSchema(draft, {
                type: "array",
                items: { type: "string", minLength: 1 }
            });

            const schema = node.get("0")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });

    describe("items-array", () => {
        it("should step into items without data", () => {
            const node = compileSchema(draft, {
                type: "array",
                items: [{ type: "number" }, { type: "string", minLength: 1 }]
            });

            const schema = node.get("1")?.schema;

            assert.deepEqual(schema, { type: "string", minLength: 1 });
        });
    });
});

describe("compiled object schema - validate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return an error if maxProperties is exceeded", () => {
        const node = compileSchema(draft, {
            type: "object",
            maxProperties: 1
        });

        const errors = node.validate({ a: "1", b: "2" });

        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "max-properties-error");
    });

    it("should return an error if maxProperties of nested properties is exceeded", () => {
        // tests validation walking through properties
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                header: {
                    type: "object",
                    maxProperties: 1
                }
            }
        });

        const errors = node.validate({ header: { a: "1", b: "2" } });

        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "max-properties-error");
    });
});

describe("compiled value schema - validate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return error for string shorter than minLength", () => {
        const node = compileSchema(draft, { type: "string", minLength: 2 });

        const errors = node.validate("a");

        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-error");
    });
});

describe("compiled object schema - getTemplate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return default value of properties", () => {
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                header: { type: "string", default: "title" }
            }
        });

        const data = node.getTemplate();

        assert.deepEqual(data, { header: "title" });
    });
});
