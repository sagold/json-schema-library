import { strict as assert } from "assert";
import getTypeOf from "./getTypeOf";

describe("getTypeOf", () => {
    it("should return 'string' for \"\"", () => {
        assert.deepEqual(getTypeOf(""), "string");
    });

    it("should return 'boolean' for false", () => {
        assert.deepEqual(getTypeOf(false), "boolean");
    });

    it("should return 'number' for 0", () => {
        assert.deepEqual(getTypeOf(0), "number");
    });

    it("should return 'regexp' for /^/", () => {
        assert.deepEqual(getTypeOf(/^/), "regexp");
    });

    it("should return 'regexp' for 'new RegExp()'", () => {
        assert.deepEqual(getTypeOf(new RegExp("")), "regexp");
    });

    it("should return 'object' for {}", () => {
        assert.deepEqual(getTypeOf({}), "object");
    });

    it("should return 'array' for []", () => {
        assert.deepEqual(getTypeOf([]), "array");
    });

    it("should return 'null' for null", () => {
        assert.deepEqual(getTypeOf(null), "null");
    });

    it("should return 'undefined' for undefined", () => {
        // @ts-expect-error missing argument
        assert.deepEqual(getTypeOf(), "undefined");
    });
});
