import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";
import { isSchemaNode } from "../types";

describe("feature : oneOf : reduce", () => {
    it("should resolve matching value schema", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduce({ data: 111 });

        assert.deepEqual(node.schema, { type: "number", title: "A Number" });
        // assert.equal(node.oneOfIndex, 1, "should have exposed correct resolved oneOfIndex");
    });

    it("should return boolean schema `false` if no matching schema could be found", () => {
        const node = compileSchema({
            oneOf: [
                { type: "string", title: "A String" },
                { type: "number", title: "A Number" }
            ]
        }).reduce({ data: {} });

        assert(isSchemaNode(node));
        assert.equal(node.schema, false);
    });

    // it("should reduce nested oneOf objects using ref", () => {
    //     const node = compileSchema({
    //         $defs: {
    //             withData: {
    //                 oneOf: [{ required: ["b"], properties: { b: { type: "number" } } }]
    //             }
    //         },
    //         oneOf: [{ required: ["a"], properties: { a: { type: "string" } } }, { $ref: "#/$defs/withData" }]
    //     }).reduce({ data: { b: 111 } });

    //     assert(isSchemaNode(node), "should have return schema-node");
    //     delete node.schema.$defs;
    //     assert.deepEqual(node.schema, { required: ["b"], properties: { b: { type: "number" } } });
    // });

    // it("should reduce nested oneOf boolean schema using ref", () => {
    //     const node = compileSchema({
    //         $defs: {
    //             withData: {
    //                 oneOf: [{ required: ["b"], properties: { b: true } }]
    //             }
    //         },
    //         oneOf: [{ required: ["a"], properties: { a: false } }, { $ref: "#/$defs/withData" }]
    //     }).reduce({ data: { b: 111 } });

    //     assert(isSchemaNode(node), "should have return schema-node");
    //     delete node.schema.$defs;
    //     assert.deepEqual(node.schema, { required: ["b"], properties: { b: true } });
    // });

    // v2
    it("should resolve matching object schema", () => {
        const node = compileSchema({
            oneOf: [
                {
                    type: "object",
                    properties: { title: { type: "string" } }
                },
                {
                    type: "object",
                    properties: { title: { type: "number" } }
                }
            ]
        }).reduce({ data: { title: 4 } });

        assert.deepEqual(node.schema, {
            type: "object",
            properties: { title: { type: "number" } }
        });
    });

    // v2
    it("should return matching oneOf, for objects missing properties", () => {
        const node = compileSchema({
            oneOf: [
                {
                    type: "object",
                    additionalProperties: { type: "string" }
                },
                {
                    type: "object",
                    additionalProperties: { type: "number" }
                }
            ]
        }).reduce({ data: { title: 4, test: 2 } });

        assert.deepEqual(node.schema, {
            type: "object",
            additionalProperties: { type: "number" }
        });
    });

    // @todo
    describe("object", () => {
        // // PR #35 https://github.com/sagold/json-schema-library/pull/35/commits/8b6477113bdfce522081473bb0dd8fd6fe680391
        // it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        //     draft.addRemoteSchema("https://my-other-schema.com/schema.json", {
        //         type: "object",
        //         properties: {
        //             innerTitle: { $ref: "#/definitions/number" }
        //         },
        //         definitions: {
        //             number: { type: "number", title: "Zahl" }
        //         }
        //     });
        //     const schema = draft.compileSchema({
        //         type: "object",
        //         properties: {
        //             title: {
        //                 oneOf: [
        //                     {
        //                         type: "object",
        //                         properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
        //                     },
        //                     { $ref: "https://my-other-schema.com/schema.json" }
        //                 ]
        //             }
        //         }
        //     });
        //     const res = step("title", schema, { title: { innerTitle: 111 } });
        //     expect(res.type).to.eq("object");
        //     const nextRes = step("innerTitle", res, { innerTitle: 111 });
        //     expect(nextRes.type).to.eq("number");
        // });
        // it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        //     draft.addRemoteSchema("https://my-other-schema.com/schema.json", {
        //         type: "object",
        //         properties: {
        //             innerTitle: { $ref: "#/definitions/number" }
        //         },
        //         definitions: {
        //             number: { type: "number", title: "Zahl" }
        //         }
        //     });
        //     const schema = draft.compileSchema({
        //         type: "object",
        //         properties: {
        //             title: {
        //                 oneOf: [
        //                     {
        //                         type: "object",
        //                         properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
        //                     },
        //                     { $ref: "https://my-other-schema.com/schema.json" }
        //                 ]
        //             }
        //         }
        //     });
        //     const res = step("title", schema, { title: { innerTitle: 111 } });
        //     expect(res.type).to.eq("object");
        //     const nextRes = step("innerTitle", res, { innerTitle: 111 });
        //     expect(nextRes.type).to.eq("number");
        // });
    });
});

describe("feature : oneof : validate", () => {
    it("should validate matching oneOf", () => {
        const errors = compileSchema({
            oneOf: [
                { type: "object", properties: { value: { type: "string" } } },
                { type: "object", properties: { value: { type: "integer" } } }
            ]
        }).validate({ value: "a string" });
        assert.equal(errors.length, 0);
    });

    it("should return error for non-matching oneOf", () => {
        const errors = compileSchema({
            type: "object",
            oneOf: [
                { type: "object", properties: { value: { type: "string" } } },
                { type: "object", properties: { value: { type: "integer" } } }
            ]
        }).validate({ value: [] });
        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "one-of-error");
    });
});
