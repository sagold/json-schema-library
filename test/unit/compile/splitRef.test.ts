import { expect } from "chai";
import splitRef from "../../../lib/compile/splitRef";


describe("compile.splitRef", () => {

    it("should return empty list for empty string", () => {
        const result = splitRef("");

        expect(result).to.deep.eq([]);
    });

    it("should return empty list for root pointer", () => {
        const result = splitRef("#");

        expect(result).to.deep.eq([]);
    });

    it("should return input pointer", () => {
        const result = splitRef("#/a/b");

        expect(result).to.deep.eq(["#/a/b"]);
    });

    it("should return input id", () => {
        const result = splitRef("#ab");

        expect(result).to.deep.eq(["#ab"]);
    });

    it("should return sanitized url", () => {
        const result = splitRef("http://example.com/");

        expect(result).to.deep.eq(["http://example.com"]);
    });

    it("should return sanitized url", () => {
        const result = splitRef("http://example.com/#");

        expect(result).to.deep.eq(["http://example.com"]);
    });

    it("should return sanitized url and id", () => {
        const result = splitRef("http://example.com/#ab");

        expect(result).to.deep.eq(["http://example.com", "#ab"]);
    });

    it("should return sanitized url and pointer", () => {
        const result = splitRef("http://example.com/#/a/b");

        expect(result).to.deep.eq(["http://example.com", "#/a/b"]);
    });
});
