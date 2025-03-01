import { strict as assert } from "assert";
import joinScope from "./joinScope";

describe("joinScope", () => {
    it("should return initial base", () => {
        const url = joinScope("https://localhost.com/");

        assert.equal(url, "https://localhost.com/");
    });

    it("should not change previous scope for empty id", () => {
        const url = joinScope("https://localhost.com", "");

        assert.equal(url, "https://localhost.com");
    });

    it("should return base without trailing #", () => {
        const url = joinScope("https://localhost.com/#");

        assert.equal(url, "https://localhost.com/");
    });

    it("should join domain with folder", () => {
        const url = joinScope("https://localhost.com/", "folder");

        assert.equal(url, "https://localhost.com/folder");
    });

    it("should join domain with folder/", () => {
        const url = joinScope("https://localhost.com/", "folder/");

        assert.equal(url, "https://localhost.com/folder/");
    });

    it("should add file to domain with folder/", () => {
        const url = joinScope("https://localhost.com/folder/", "remote.json");

        assert.equal(url, "https://localhost.com/folder/remote.json");
    });

    it("should replace fragments not ending with slash", () => {
        const url = joinScope("https://localhost.com/root", "folder/");

        assert.equal(url, "https://localhost.com/folder/");
    });

    it("should append id to url", () => {
        const url = joinScope("https://localhost.com/root", "#bar");

        assert.equal(url, "https://localhost.com/root#bar");
    });

    it("should append id to url/", () => {
        const url = joinScope("https://localhost.com/root/", "#bar");

        assert.equal(url, "https://localhost.com/root/#bar");
    });

    it("should override base root", () => {
        const url = joinScope("https://localhost.com/root/", "https://example.com/");

        assert.equal(url, "https://example.com/");
    });

    it("should replace id", () => {
        const url = joinScope("https://localhost.com/root#bar", "#baz");

        assert.equal(url, "https://localhost.com/root#baz");
    });

    it("should replace pointer", () => {
        const url = joinScope("https://localhost.com/root#/definitions/foo", "#/definitions/bar");

        assert.equal(url, "https://localhost.com/root#/definitions/bar");
    });

    it("should join absolute-path-reference", () => {
        const url = joinScope("https://example.com/ref/absref.json", "/absref/foobar.json");

        assert.equal(url, "https://example.com/absref/foobar.json");
    });
});
