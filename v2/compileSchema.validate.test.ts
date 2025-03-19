import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { SchemaNode } from "./types";

describe("compileSchema.validate", () => {});

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
