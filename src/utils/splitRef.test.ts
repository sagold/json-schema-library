import { strict as assert } from "assert";
import splitRef from "./splitRef.js";

describe("compile.splitRef", () => {
    it("should return empty list for empty string", () => {
        const result = splitRef("");

        assert.deepEqual(result, []);
    });

    it("should return empty list for root pointer", () => {
        const result = splitRef("#");

        assert.deepEqual(result, []);
    });

    it("should return input pointer from uri fragment", () => {
        const result = splitRef("#/a/b");

        assert.deepEqual(result, ["#/a/b"]);
    });

    it("should return input pointer", () => {
        const result = splitRef("/a/b");

        assert.deepEqual(result, ["/a/b"]);
    });

    it("should return input id", () => {
        const result = splitRef("#ab");

        assert.deepEqual(result, ["#ab"]);
    });

    it("should return sanitized url", () => {
        const result = splitRef("http://example.com/");

        assert.deepEqual(result, ["http://example.com"]);
    });

    it("should return sanitized url", () => {
        const result = splitRef("http://example.com/#");

        assert.deepEqual(result, ["http://example.com"]);
    });

    it("should return sanitized url and id", () => {
        const result = splitRef("http://example.com/#ab");

        assert.deepEqual(result, ["http://example.com", "#ab"]);
    });

    it("should return sanitized url and pointer", () => {
        const result = splitRef("http://example.com/#/a/b");

        assert.deepEqual(result, ["http://example.com", "#/a/b"]);
    });
});
