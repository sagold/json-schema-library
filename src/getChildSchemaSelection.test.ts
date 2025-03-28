import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { getChildSchemaSelection } from "./getChildSchemaSelection";
import { isJsonError } from "./types";

describe("getChildSchemaSelection", () => {
    it("should return a single object-schema as list", () => {
        const node = compileSchema({
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        });

        const result = getChildSchemaSelection(node, "b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 1);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "number" }]
        );
    });

    it("should return a single array-item as list", () => {
        const node = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });
        const result = getChildSchemaSelection(node, 0);

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 1);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }]
        );
    });

    it("should return an empty array if items schema is undefined", () => {
        const node = compileSchema({
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });
        const result = getChildSchemaSelection(node, 2);

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 0);
    });

    it("should return list of oneOf elements", () => {
        const node = compileSchema({
            type: "array",
            items: {
                oneOf: [{ type: "string" }, { type: "number" }]
            }
        });
        const result = getChildSchemaSelection(node, "b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 2);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }, { type: "number" }]
        );
    });

    it("should resolve items from oneOf elements", () => {
        const node = compileSchema({
            type: "array",
            items: {
                oneOf: [{ $ref: "#/definitions/string" }, { $ref: "#/definitions/number" }]
            },
            definitions: {
                number: { type: "number" },
                string: { type: "string" }
            }
        });
        const result = getChildSchemaSelection(node, "b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 2);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }, { type: "number" }]
        );
    });

    describe("additionalItems", () => {
        it("should return empty list if additionalItems is false", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: false
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 0);
        });

        it("should return empty list if additionalItems is undefined", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: undefined
            });

            const result = getChildSchemaSelection(node, 1);

            assert.deepEqual(result.length, 0);
        });

        it("should return string-schema if additionalItems is true", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: true
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ type: "string" }]
            );
        });

        it("should return additionalItem schema", () => {
            const node = compileSchema({
                type: "array",
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ id: "number", type: "number", default: 2 }]
            );
        });

        it("should return additionalItem schema when items-list is exceeded", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ id: "number", type: "number", default: 2 }]
            );
        });

        it("should return items-schema instead of additionalItems if item is defined", () => {
            const node = compileSchema({
                type: "array",
                items: [{ type: "string" }, { type: "string" }],
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ type: "string" }]
            );
        });

        it("should not return additionalItems if item-schema is object", () => {
            const node = compileSchema({
                type: "array",
                items: { type: "string" },
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(node, 1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ type: "string" }]
            );
        });
    });
});
