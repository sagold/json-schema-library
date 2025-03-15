import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode, SchemaNode } from "./types";

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

describe("compileSchema : reduce", () => {
    describe("behaviour", () => {});

    it("should return schema for boolean schema true", () => {
        // @ts-expect-error boolean schema still untyped
        const node = compileSchema(true);

        const schema = node.reduce({ data: 123 })?.schema;

        assert.deepEqual(schema, { type: "number" });
    });

    it("should compile schema with current data", () => {
        const node = compileSchema({
            type: "object",
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            }
        });

        const dataNode = node.reduce({ data: { withHeader: true } });

        assert.deepEqual(dataNode?.schema, {
            type: "object",
            required: ["header"],
            properties: { header: { type: "string", minLength: 1 } }
        });
    });

    it("should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema({
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
            required: ["date", "header"],
            properties: {
                header: { type: "string", minLength: 1 },
                date: { type: "string", format: "date" }
            }
        });
    });

    it.skip("should recursively compile schema with current data", () => {
        const node = compileSchema({
            type: "object",
            properties: {
                article: {
                    type: "object",
                    if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                    then: {
                        required: ["header"],
                        properties: { header: { type: "string", minLength: 1 } }
                    }
                }
            }
        });

        const dataNode = node.reduce({ data: { article: { withHeader: true } } });

        assert.deepEqual(dataNode?.schema, {
            type: "object",
            properties: {
                article: {
                    type: "object",
                    required: ["header"],
                    properties: { header: { type: "string", minLength: 1 } }
                }
            }
        });
    });

    describe("object - merge all reduced dynamic schema", () => {
        it("should reduce patternProperties and allOf", () => {
            const node = compileSchema({
                allOf: [{ properties: { "107": { type: "string", maxLength: 99 } } }],
                patternProperties: { "[0-1][0-1]7": { type: "string", minLength: 1 } }
            });

            const schema = node.reduce({ data: { "107": undefined } })?.schema;

            assert.deepEqual(schema, { properties: { "107": { type: "string", minLength: 1, maxLength: 99 } } });
        });
    });

    describe("object - recursively resolve dynamic properties", () => {
        it("should reduce allOf and oneOf", () => {
            const node = compileSchema({
                allOf: [
                    {
                        oneOf: [
                            { type: "string", minLength: 1 },
                            { type: "number", minimum: 1 }
                        ]
                    }
                ]
            });

            const schema = node.reduce({ data: 123 })?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should reduce oneOf and allOf", () => {
            const node = compileSchema({
                oneOf: [{ allOf: [{ type: "string", minLength: 1 }] }, { allOf: [{ type: "number", minimum: 1 }] }]
            });

            const schema = node.reduce({ data: 123 })?.schema;

            assert.deepEqual(schema, { type: "number", minimum: 1 });
        });

        it("should iteratively resolve allOf before merging (issue#44)", () => {
            const node = compileSchema({
                type: "object",
                properties: { trigger: { type: "boolean" } },
                allOf: [
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: true } }
                            }
                        },
                        then: {
                            properties: { trigger: { type: "boolean", const: false } }
                        }
                    },
                    {
                        if: {
                            not: {
                                properties: { trigger: { type: "boolean", const: false } }
                            }
                        },
                        then: {
                            properties: { trigger: { const: true } }
                        }
                    }
                ]
            }).reduce({ data: { trigger: true } });

            assert(isSchemaNode(node));
            assert.deepEqual(node.schema, {
                type: "object",
                properties: {
                    trigger: { type: "boolean", const: true }
                }
            });
        });
    });
});

describe("compileSchema : spec/unevaluatedProperties", () => {
    describe("dynamic evalation inside nested refs", () => {
        let node: SchemaNode;
        beforeEach(() => {
            node = compileSchema({
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: {
                    one: {
                        oneOf: [
                            { $ref: "#/$defs/two" },
                            { required: ["b"], properties: { b: true } },
                            { required: ["xx"], patternProperties: { x: true } },
                            { required: ["all"], unevaluatedProperties: true }
                        ]
                    },
                    two: {
                        oneOf: [
                            { required: ["c"], properties: { c: true } },
                            { required: ["d"], properties: { d: true } }
                        ]
                    }
                },
                oneOf: [{ $ref: "#/$defs/one" }, { required: ["a"], properties: { a: true } }],
                unevaluatedProperties: false
            });
        });

        it("should validate a", () => {
            const errors = node.validate({ a: 1 });

            assert(errors.length === 0);
        });
    });
});

describe("compileSchema : spec/recursiveRef", () => {
    describe("$recursiveRef without using nesting", () => {
        it("integer does not match as a property value", () => {
            // how it should resolve
            // { foo } » root:anyOf: [false, ?]
            //      1. resolve http://localhost:4242/draft2019-09/recursiveRef2/schema.json#/$defs/myobject
            //      => domain + local path (fragments 2) => myobject-schema
            //      2. { foo } » anyOf: [false, true + ?]
            //          3. { foo } » myObject:anyof:additionalProperties => recursiveRef
            //          => recursiveAnchor = myObject
            //          4. 1 » anyOf: [false, false] => error
            const node = compileSchema({
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:4242/draft2019-09/recursiveRef2/schema.json",
                $defs: {
                    myobject: {
                        $id: "myobject.json",
                        $recursiveAnchor: true,
                        anyOf: [
                            { type: "string" },
                            {
                                type: "object",
                                additionalProperties: { $recursiveRef: "#" }
                            }
                        ]
                    }
                },
                anyOf: [{ type: "integer" }, { $ref: "#/$defs/myobject" }]
            });

            const errors = node.validate({ foo: 1 });

            assert(errors.length > 0, "should have returned error for invalid integer");
        });
    });

    describe("$recursiveRef with $recursiveAnchor: false works like $ref", () => {
        let node: SchemaNode;
        beforeEach(() => {
            node = compileSchema({
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:4242/draft2019-09/recursiveRef4/schema.json",
                $recursiveAnchor: false,
                $defs: {
                    myobject: {
                        $id: "myobject.json",
                        $recursiveAnchor: false,
                        anyOf: [
                            { type: "string" },
                            {
                                type: "object",
                                additionalProperties: { $recursiveRef: "#" }
                            }
                        ]
                    }
                },
                anyOf: [{ type: "integer" }, { $ref: "#/$defs/myobject" }]
            });
        });

        it("single level match", () => {
            // how it should resolve
            // { foo } » root:anyOf: [false, ?]
            //      1. resolve http://localhost:4242/draft2019-09/recursiveRef2/schema.json#/$defs/myobject
            //      => domain + local path (fragments 2) => myobject-schema
            //      2. { foo } » anyOf: [false, true + ?]
            //          3. { foo } » myObject:anyof:additionalProperties => recursiveRef
            //          => recursiveAnchor = myObject
            //          4. 1 » anyOf: [false, false] => error
            const errors = node.validate({ foo: "hi" });
            assert(errors.length === 0, "should have validated data");
        });

        it("integer does not match as a property value", () => {
            const errors = node.validate({ foo: 1 });
            assert(errors.length > 0, "should have returned error for integer");
        });
    });
});
