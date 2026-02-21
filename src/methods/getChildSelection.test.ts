import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
import { isJsonError } from "../types";

describe("getChildSelection", () => {
    it("should return a single object-schema as list", () => {
        const result = compileSchema({
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        }).getChildSelection("b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 1);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "number" }]
        );
    });

    it("should return a single array-item as list", () => {
        const result = compileSchema({
            type: "array",
            prefixItems: [{ type: "string" }, { type: "number" }]
        }).getChildSelection(0);

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 1);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }]
        );
    });

    it("should return resolved $ref", () => {
        const result = compileSchema({
            type: "array",
            prefixItems: [{ $ref: "#/$defs/first" }, { $ref: "#/$defs/second" }],
            $defs: {
                first: { type: "string" },
                second: { type: "number" }
            }
        }).getChildSelection(1);

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 1);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "number" }]
        );
    });

    it("should return an empty array if items schema is undefined", () => {
        const result = compileSchema({
            type: "array",
            prefixItems: [{ type: "string" }, { type: "number" }]
        }).getChildSelection(2);

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 0);
    });

    it("should return list of oneOf elements", () => {
        const result = compileSchema({
            type: "array",
            items: {
                oneOf: [{ type: "string" }, { type: "number" }]
            }
        }).getChildSelection("b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 2);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }, { type: "number" }]
        );
    });

    it("should resolve items from oneOf elements", () => {
        const result = compileSchema({
            type: "array",
            items: {
                oneOf: [{ $ref: "#/definitions/string" }, { $ref: "#/definitions/number" }]
            },
            definitions: {
                number: { type: "number" },
                string: { type: "string" }
            }
        }).getChildSelection("b");

        assert(!isJsonError(result));
        assert.deepEqual(result.length, 2);
        assert.deepEqual(
            result.map((n) => n.schema),
            [{ type: "string" }, { type: "number" }]
        );
    });

    describe("additionalItems", () => {
        it("should return empty list if additionalItems is false", () => {
            const result = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }],
                items: false
            }).getChildSelection(1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 0);
        });

        it("should return empty list if additionalItems is undefined", () => {
            const result = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }],
                items: undefined
            }).getChildSelection(1);

            assert.deepEqual(result.length, 0);
        });

        it("should return string-schema if additionalItems is true", () => {
            const result = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }],
                items: true
            }).getChildSelection(1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ type: "string" }]
            );
        });

        it("should return additionalItem schema", () => {
            const result = compileSchema({
                type: "array",
                items: { id: "number", type: "number", default: 2 }
            }).getChildSelection(1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ id: "number", type: "number", default: 2 }]
            );
        });

        it("should return additionalItem schema when items-list is exceeded", () => {
            const result = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }],
                items: { id: "number", type: "number", default: 2 }
            }).getChildSelection(1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(
                result.map((n) => n.schema),
                [{ id: "number", type: "number", default: 2 }]
            );
        });

        it("should return items-schema instead of additionalItems if item is defined", () => {
            const result = compileSchema({
                type: "array",
                prefixItems: [{ type: "string" }, { type: "string" }],
                items: { id: "number", type: "number", default: 2 }
            }).getChildSelection(1);

            assert(!isJsonError(result));
            assert.deepEqual(result.length, 1);
            assert.deepEqual(result[0].schema, { type: "string" });
        });
    });
});
