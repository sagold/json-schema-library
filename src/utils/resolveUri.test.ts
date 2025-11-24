import { strict as assert } from "assert";
import { resolveUri } from "./resolveUri";

describe("resolveUri", () => {
    it("should return initial base", () => {
        const url = resolveUri("https://localhost.com/");

        assert.equal(url, "https://localhost.com/");
    });

    it("should not change previous scope for empty id", () => {
        const url = resolveUri("https://localhost.com", "");

        assert.equal(url, "https://localhost.com");
    });

    it("should return base without trailing #", () => {
        const url = resolveUri("https://localhost.com/#");

        assert.equal(url, "https://localhost.com/");
    });

    it("should join domain with folder", () => {
        const url = resolveUri("https://localhost.com/", "folder");

        assert.equal(url, "https://localhost.com/folder");
    });

    it("should join domain with folder/", () => {
        const url = resolveUri("https://localhost.com/", "folder/");

        assert.equal(url, "https://localhost.com/folder/");
    });

    it("should add file to domain with folder/", () => {
        const url = resolveUri("https://localhost.com/folder/", "remote.json");

        assert.equal(url, "https://localhost.com/folder/remote.json");
    });

    it("should replace fragments not ending with slash", () => {
        const url = resolveUri("https://localhost.com/root", "folder/");

        assert.equal(url, "https://localhost.com/folder/");
    });

    it("should append id to url", () => {
        const url = resolveUri("https://localhost.com/root", "#bar");

        assert.equal(url, "https://localhost.com/root#bar");
    });

    // thats a contradiction to json-schema-spec
    // it("should append id without fragment to url", () => {
    //     const url = resolveUri("https://localhost.com/root", "bar");

    //     assert.equal(url, "https://localhost.com/root/bar");
    // });

    it("should append id to url/", () => {
        const url = resolveUri("https://localhost.com/root/", "#bar");

        assert.equal(url, "https://localhost.com/root/#bar");
    });

    it("should override base root", () => {
        const url = resolveUri("https://localhost.com/root/", "https://example.com/");

        assert.equal(url, "https://example.com/");
    });

    it("should replace id", () => {
        const url = resolveUri("https://localhost.com/root#bar", "#baz");

        assert.equal(url, "https://localhost.com/root#baz");
    });

    it("should replace pointer", () => {
        const url = resolveUri("https://localhost.com/root#/definitions/foo", "#/definitions/bar");

        assert.equal(url, "https://localhost.com/root#/definitions/bar");
    });

    it("should join absolute-path-reference", () => {
        const url = resolveUri("https://example.com/ref/absref.json", "/absref/foobar.json");

        assert.equal(url, "https://example.com/absref/foobar.json");
    });

    it("should ignore relative origin when next id starts with fragment url", () => {
        // there is a bug joining multiple fragments to e.g. #/base#/examples/0
        // from "$id": "/base" +  $ref "#/examples/0" (in refOfUnknownKeyword spec)
        const url = resolveUri("/base", "#/examples/0");

        assert.equal(url, "#/examples/0");
    });

    it("should correctly join url-encoded path", () => {
        const url = resolveUri(
            "json-schemer://schema",
            "1c_list_Document_%D0%A1%D0%B1%D0%BE%D1%80%D0%BA%D0%B0%D0%97%D0%B0%D0%BF%D0%B0%D1%81%D0%BE%D0%B2"
        );
        assert.equal(
            url,
            "json-schemer://schema/1c_list_Document_%D0%A1%D0%B1%D0%BE%D1%80%D0%BA%D0%B0%D0%97%D0%B0%D0%BF%D0%B0%D1%81%D0%BE%D0%B2"
        );
    });
});
