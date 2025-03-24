/* eslint quote-props: 0, no-unused-expressions: 0 */
import { strict as assert } from "assert";
import { eachSchema } from "./eachSchema";
import { compileSchema } from "./compileSchema";

describe("eachSchema", () => {
    it("should execute callback on root-schema", () => {
        let firstCall: unknown;
        const rootSchema = compileSchema({
            type: "object",
            properties: {}
        });

        eachSchema(rootSchema, ({ schema }) => (firstCall = firstCall || schema));

        assert.deepEqual(firstCall, rootSchema.schema);
    });

    it("should call on unspecified properties", () => {
        const calls: unknown[] = [];
        const rootSchema = compileSchema({
            type: "object",
            properties: {
                title: {}
            }
        });

        eachSchema(rootSchema, ({ spointer }) => calls.push(spointer));

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[1], "#/properties/title");
    });

    it("should call on each property schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "object",
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            }
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1].schema, rootSchema.schema.properties.first);
        assert.deepEqual(calls[1].spointer, "#/properties/first");
        assert.deepEqual(calls[2].schema, rootSchema.schema.properties.second);
        assert.deepEqual(calls[2].spointer, "#/properties/second");
    });

    it("should call on each property schema if type is missing", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            },
            $ref: "schema-relative-uri-defs2.json"
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 3);
    });

    it("should call on each item schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1].schema, rootSchema.schema.items[0]);
        assert.deepEqual(calls[1].spointer, "#/items/0");
        assert.deepEqual(calls[2].schema, rootSchema.schema.items[1]);
        assert.deepEqual(calls[2].spointer, "#/items/1");
    });

    it("should call on each item property", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "array",
            items: {
                type: "object",
                properties: {
                    first: { type: "string" },
                    second: { type: "number" }
                }
            }
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 4);
        assert.deepEqual(calls[2].schema, rootSchema.schema.items.properties.first);
        assert.deepEqual(calls[2].spointer, "#/items/properties/first");
        assert.deepEqual(calls[3].schema, rootSchema.schema.items.properties.second);
        assert.deepEqual(calls[3].spointer, "#/items/properties/second");
    });

    it("should call on each oneOf-schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            oneOf: [{ type: "string" }, { type: "number" }]
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1].schema, rootSchema.schema.oneOf[0]);
        assert.deepEqual(calls[1].spointer, "#/oneOf/0");
        assert.deepEqual(calls[2].schema, rootSchema.schema.oneOf[1]);
        assert.deepEqual(calls[2].spointer, "#/oneOf/1");
    });

    it("should call on each oneOf-schema in items", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "array",
            items: {
                oneOf: [{ type: "string" }, { type: "number" }]
            }
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 4);
        assert.deepEqual(calls[1].schema, rootSchema.schema.items);
        assert.deepEqual(calls[1].spointer, "#/items");
        assert.deepEqual(calls[2].schema, rootSchema.schema.items.oneOf[0]);
        assert.deepEqual(calls[2].spointer, "#/items/oneOf/0");
        assert.deepEqual(calls[3].schema, rootSchema.schema.items.oneOf[1]);
        assert.deepEqual(calls[3].spointer, "#/items/oneOf/1");
    });

    it("should call on each anyOf-schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            anyOf: [{ type: "string" }, { type: "number" }]
        });

        eachSchema(rootSchema, ({ schema, spointer }) => calls.push({ schema, spointer }));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1].schema, rootSchema.schema.anyOf[0]);
        assert.deepEqual(calls[1].spointer, "#/anyOf/0");
        assert.deepEqual(calls[2].schema, rootSchema.schema.anyOf[1]);
        assert.deepEqual(calls[2].spointer, "#/anyOf/1");
    });

    it("should call on each allOf-schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            allOf: [{ type: "string" }, { type: "number" }]
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1], rootSchema.schema.allOf[0]);
        assert.deepEqual(calls[2], rootSchema.schema.allOf[1]);
    });

    it("should call on definitions", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            definitions: {
                image: {
                    type: "string",
                    format: "url"
                }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[1], rootSchema.schema.definitions.image);
    });

    it("should call on additionalProperties", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "object",
            additionalProperties: {
                type: "object",
                properties: {
                    url: { type: "string" }
                }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[1], rootSchema.schema.additionalProperties);
    });

    it("should ignore dependency list", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            dependencies: {
                url: ["title"]
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 1);
    });

    it("should call on each dependency schema", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "object",
            dependencies: {
                url: ["title"],
                target: {
                    type: "string"
                }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[1], rootSchema.schema.dependencies.target);
    });

    it("should iterate definitions", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            definitions: {
                bar: { type: "array" }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 2);
        assert.deepEqual(calls[0], rootSchema.schema);
        assert.deepEqual(calls[1], rootSchema.schema.definitions.bar);
    });

    it("should iterate over nested definitions", () => {
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            definitions: {
                bar: { type: "array" },
                nested: {
                    definitions: {
                        foo: { type: "string" }
                    }
                }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 4);
        assert.deepEqual(calls[0], rootSchema.schema);
        assert.deepEqual(calls[1], rootSchema.schema.definitions.bar);
        assert.deepEqual(calls[2], rootSchema.schema.definitions.nested);
        assert.deepEqual(calls[3], rootSchema.schema.definitions.nested.definitions.foo);
    });

    it("should support array-types", () => {
        // https://json-schema.org/draft/2020-12/json-schema-draft.html#rfc.section.7.6.1
        const calls: Record<string, unknown>[] = [];
        const rootSchema = compileSchema({
            type: "object",
            properties: {
                simple: {
                    type: ["string", "number"]
                },
                primitive: {
                    type: ["string", "null"]
                }
            }
        });

        eachSchema(rootSchema, ({ schema }) => calls.push(schema));

        assert.deepEqual(calls.length, 3);
        assert.deepEqual(calls[0], rootSchema.schema);
        assert.deepEqual(calls[1], rootSchema.schema.properties.simple);
        assert.deepEqual(calls[2], rootSchema.schema.properties.primitive);
    });
});
