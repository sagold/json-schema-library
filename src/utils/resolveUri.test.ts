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

    it("normalizes equivalent pointer fragments in each URI resolution path", () => {
        const root = "https://example.test/cost%24/root";
        for (const [token, encoded] of [["cost$", "cost%24"], ["cost%24", "cost%24"], ["cost%2524", "cost%2524"]]) {
            const pointer = `#/$defs/${token}`;
            const normalized = `#/%24defs/${encoded}`;
            assert.equal(resolveUri(pointer), normalized);
            assert.equal(resolveUri(undefined, pointer), normalized);
            assert.equal(resolveUri("#", pointer), normalized);
            assert.equal(resolveUri("/base", pointer), normalized);
            assert.equal(resolveUri(root, pointer), `${root}${normalized}`);
            assert.equal(resolveUri(root, `${root}${pointer}`), `${root}${normalized}`);
            assert.equal(resolveUri(root, `child${pointer}`), `https://example.test/cost%24/child${normalized}`);
        }
    });

    it("normalizes encoded pointer separators without decoding literal percent names twice", () => {
        const root = "https://example.test/path%2Froot";
        for (const fragment of ["#/$defs/target", "#%2F$defs%2Ftarget", "#%2f%24defs%2ftarget", "#/$defs%2Ftarget"]) {
            const expected = "#/%24defs/target";
            assert.equal(resolveUri(fragment), expected);
            assert.equal(resolveUri(undefined, fragment), expected);
            assert.equal(resolveUri("#", fragment), expected);
            assert.equal(resolveUri("/base", fragment), expected);
            assert.equal(resolveUri(root, fragment), `${root}${expected}`);
            assert.equal(resolveUri(root, `${root}${fragment}`), `${root}${expected}`);
            assert.equal(resolveUri(root, `child${fragment}`), `https://example.test/child${expected}`);
        }
        assert.equal(resolveUri("#%2F$defs%2Fa%252Fb"), "#/%24defs/a%252Fb");
        assert.equal(resolveUri("#%2F$defs%2Fa%23%252Fb"), "#/%24defs/a%23%252Fb");
        assert.equal(resolveUri("#%252F$defs%2Ftarget"), "#%252F$defs%2Ftarget");
        assert.equal(resolveUri("#named%2Fpart"), "#named%2Fpart");
    });

    it("normalizes unreserved characters in named-anchor fragments", () => {
        const root = "https://example.test/cost%24/root";
        for (const anchor of ["#node", "#n%6Fde", "#%6eode"]) {
            assert.equal(resolveUri(anchor), "#node");
            assert.equal(resolveUri(undefined, anchor), "#node");
            assert.equal(resolveUri("#", anchor), "#node");
            assert.equal(resolveUri("/base", anchor), "#node");
            assert.equal(resolveUri(root, anchor), `${root}#node`);
            assert.equal(resolveUri(root, `${root}${anchor}`), `${root}#node`);
            assert.equal(resolveUri(root, `child${anchor}`), "https://example.test/cost%24/child#node");
        }
        assert.equal(resolveUri("#A%5F%2D%2E%7E%30"), "#A_-.~0");
        assert.equal(resolveUri("#n%256Fde"), "#n%256Fde");
    });

    it("preserves document URI and reserved named-anchor characters", () => {
        const root = "https://example.test/cost%24/root";
        for (const suffix of ["$", "%24"]) {
            const document = `https://example.test/child${suffix}`;
            const anchor = `#named${suffix}`;
            assert.equal(resolveUri(document), document);
            assert.equal(resolveUri(root, document), document);
            assert.equal(resolveUri(root, `child${suffix}`), `https://example.test/cost%24/child${suffix}`);
            assert.equal(resolveUri(anchor), anchor);
            assert.equal(resolveUri(undefined, anchor), anchor);
            assert.equal(resolveUri(root, anchor), `${root}${anchor}`);
        }
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
