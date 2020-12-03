import { expect } from "chai";
import joinScope from "../../../lib/compile/joinScope";
describe("joinScope", () => {
    describe("single param", () => {
        it("should return base without trailing #", () => {
            const url = joinScope("http://localhost.com/#");
            expect(url).to.eq("http://localhost.com/");
        });
        it("should join domain with folder", () => {
            const url = joinScope("http://localhost.com/", "folder");
            expect(url).to.eq("http://localhost.com/folder");
        });
        it("should join domain with folder/", () => {
            const url = joinScope("http://localhost.com/", "folder/");
            expect(url).to.eq("http://localhost.com/folder/");
        });
        it("should add file to domain with folder/", () => {
            const url = joinScope("http://localhost.com/folder/", "remote.json");
            expect(url).to.eq("http://localhost.com/folder/remote.json");
        });
        it("should replace fragments not ending with slash", () => {
            const url = joinScope("http://localhost.com/root", "folder/");
            expect(url).to.eq("http://localhost.com/folder/");
        });
        it("should append id to url", () => {
            const url = joinScope("http://localhost.com/root", "#bar");
            expect(url).to.eq("http://localhost.com/root#bar");
        });
        it("should append id to url/", () => {
            const url = joinScope("http://localhost.com/root/", "#bar");
            expect(url).to.eq("http://localhost.com/root/#bar");
        });
        it("should override base root", () => {
            const url = joinScope("http://localhost.com/root/", "http://example.com/");
            expect(url).to.eq("http://example.com/");
        });
        it("should replace id", () => {
            const url = joinScope("http://localhost.com/root#bar", "#baz");
            expect(url).to.eq("http://localhost.com/root#baz");
        });
        it("should replace pointer", () => {
            const url = joinScope("http://localhost.com/root#/definitions/foo", "#/definitions/bar");
            expect(url).to.eq("http://localhost.com/root#/definitions/bar");
        });
    });
});
