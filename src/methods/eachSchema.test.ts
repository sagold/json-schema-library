/* eslint quote-props: 0, no-unused-expressions: 0 */
import { strict as assert } from "assert";
import { toSchemaNodes } from "./toSchemaNodes.js";
import { compileSchema } from "../compileSchema.js";

describe("toSchemaNodes", () => {
    it("should execute callback on root-schema", () => {
        const rootSchema = compileSchema({
            type: "object",
            properties: {}
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes[0].schema, rootSchema.schema);
    });

    it("should call on unspecified properties", () => {
        const rootSchema = compileSchema({
            type: "object",
            properties: {
                title: {}
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 2);
        assert.deepEqual(nodes[1].evaluationPath, "#/properties/title");
    });

    it("should call on each property schema", () => {
        const rootSchema = compileSchema({
            type: "object",
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.properties.first);
        assert.deepEqual(nodes[1].evaluationPath, "#/properties/first");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.properties.second);
        assert.deepEqual(nodes[2].evaluationPath, "#/properties/second");
    });

    it("should call on each property schema if type is missing", () => {
        const rootSchema = compileSchema({
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            },
            $ref: "schema-relative-uri-defs2.json"
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
    });

    it("should call on each item schema", () => {
        const rootSchema = compileSchema({
            $schema: "draft-2019-09",
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.items[0]);
        assert.deepEqual(nodes[1].evaluationPath, "#/items/0");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.items[1]);
        assert.deepEqual(nodes[2].evaluationPath, "#/items/1");
    });

    it("should call on each prefixItem", () => {
        const rootSchema = compileSchema({
            type: "array",
            prefixItems: [{ type: "string" }, { type: "number" }]
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.prefixItems[0]);
        assert.deepEqual(nodes[1].evaluationPath, "#/prefixItems/0");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.prefixItems[1]);
        assert.deepEqual(nodes[2].evaluationPath, "#/prefixItems/1");
    });

    it("should call on each item property", () => {
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

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 4);
        assert.deepEqual(nodes[2].schema, rootSchema.schema.items.properties.first);
        assert.deepEqual(nodes[2].evaluationPath, "#/items/properties/first");
        assert.deepEqual(nodes[3].schema, rootSchema.schema.items.properties.second);
        assert.deepEqual(nodes[3].evaluationPath, "#/items/properties/second");
    });

    it("should call on each oneOf-schema", () => {
        const rootSchema = compileSchema({
            oneOf: [{ type: "string" }, { type: "number" }]
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.oneOf[0]);
        assert.deepEqual(nodes[1].evaluationPath, "#/oneOf/0");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.oneOf[1]);
        assert.deepEqual(nodes[2].evaluationPath, "#/oneOf/1");
    });

    it("should call on each oneOf-schema in items", () => {
        const rootSchema = compileSchema({
            type: "array",
            items: {
                oneOf: [{ type: "string" }, { type: "number" }]
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 4);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.items);
        assert.deepEqual(nodes[1].evaluationPath, "#/items");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.items.oneOf[0]);
        assert.deepEqual(nodes[2].evaluationPath, "#/items/oneOf/0");
        assert.deepEqual(nodes[3].schema, rootSchema.schema.items.oneOf[1]);
        assert.deepEqual(nodes[3].evaluationPath, "#/items/oneOf/1");
    });

    it("should call on each anyOf-schema", () => {
        const rootSchema = compileSchema({
            anyOf: [{ type: "string" }, { type: "number" }]
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.anyOf[0]);
        assert.deepEqual(nodes[1].evaluationPath, "#/anyOf/0");
        assert.deepEqual(nodes[2].schema, rootSchema.schema.anyOf[1]);
        assert.deepEqual(nodes[2].evaluationPath, "#/anyOf/1");
    });

    it("should call on each allOf-schema", () => {
        const rootSchema = compileSchema({
            allOf: [{ type: "string" }, { type: "number" }]
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.allOf[0]);
        assert.deepEqual(nodes[2].schema, rootSchema.schema.allOf[1]);
    });

    it("should call on definitions", () => {
        const rootSchema = compileSchema({
            definitions: {
                image: {
                    type: "string",
                    format: "url"
                }
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 2);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.definitions.image);
    });

    it("should call on additionalProperties", () => {
        const rootSchema = compileSchema({
            type: "object",
            additionalProperties: {
                type: "object",
                properties: {
                    url: { type: "string" }
                }
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.additionalProperties);
    });

    it("should ignore dependency list", () => {
        const rootSchema = compileSchema({
            dependencies: {
                url: ["title"]
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 1);
    });

    it("should call on each dependency schema", () => {
        const rootSchema = compileSchema({
            type: "object",
            dependencies: {
                url: ["title"],
                target: {
                    type: "string"
                }
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 2);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.dependencies.target);
    });

    it("should iterate definitions", () => {
        const rootSchema = compileSchema({
            definitions: {
                bar: { type: "array" }
            }
        });

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 2);
        assert.deepEqual(nodes[0].schema, rootSchema.schema);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.definitions.bar);
    });

    it("should iterate over nested definitions", () => {
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

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 4);
        assert.deepEqual(nodes[0].schema, rootSchema.schema);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.definitions.bar);
        assert.deepEqual(nodes[2].schema, rootSchema.schema.definitions.nested);
        assert.deepEqual(nodes[3].schema, rootSchema.schema.definitions.nested.definitions.foo);
    });

    it("should support array-types", () => {
        // https://json-schema.org/draft/2020-12/json-schema-draft.html#rfc.section.7.6.1
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

        const nodes = toSchemaNodes(rootSchema);

        assert.deepEqual(nodes.length, 3);
        assert.deepEqual(nodes[0].schema, rootSchema.schema);
        assert.deepEqual(nodes[1].schema, rootSchema.schema.properties.simple);
        assert.deepEqual(nodes[2].schema, rootSchema.schema.properties.primitive);
    });
});
