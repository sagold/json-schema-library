import { compileSchema } from "./compileSchema";
import { Draft } from "../lib/draft";
import { Draft2019 } from "../lib/draft2019";
import { strict as assert } from "assert";
import { SchemaNode } from "./compiler/types";

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

describe("compiled object schema - get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

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
            required: ["date", "header"],
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

describe("compileSchema : spec/unevaluatedProperties", () => {
    describe("dynamic evalation inside nested refs", () => {
        let node: SchemaNode;
        beforeEach(() => {
            node = compileSchema(new Draft2019(), {
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
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

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
            const node = compileSchema(draft, {
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
            node = compileSchema(draft, {
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

describe("compiled object schema - reduce", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return schema for boolean schema true", () => {
        // @ts-expect-error boolean schema still untyped
        const node = compileSchema(draft, true);

        const schema = node.reduce({ data: 123 })?.schema;

        assert.deepEqual(schema, { type: "number" });
    });

    it("should compile schema with current data", () => {
        const node = compileSchema(draft, {
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

    it.skip("should recursively compile schema with current data", () => {
        const node = compileSchema(draft, {
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
});
