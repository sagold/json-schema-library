import { expect } from "chai";
import each from "../../lib/each";
import Core from "../../lib/cores/Draft04";
describe("each", () => {
    let core;
    before(() => {
        core = new Core();
        // @ts-ignore
        each.core = core;
    });
    it("should call callback with schema, value and pointer", () => {
        const calls = [];
        core.each(5, (...args) => calls.push(args), { type: "number" });
        expect(calls).to.have.length(1);
        expect(calls[0][0]).to.deep.eq({ type: "number" });
        expect(calls[0][1]).to.eq(5);
        expect(calls[0][2]).to.eq("#");
    });
    it("should callback for array and all array items", () => {
        const calls = [];
        core.each([5, 9], (...args) => calls.push(args), { type: "array", items: { type: "number" } });
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: { type: "number" } }, [5, 9], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "number" }, 9, "#/1"]
        ]);
    });
    it("should callback for array and pick correct schema forEach item", () => {
        const calls = [];
        core.each([5, "nine"], (...args) => calls.push(args), { type: "array", items: [{ type: "number" }, { type: "string" }] });
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: [{ type: "number" }, { type: "string" }] }, [5, "nine"], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "string" }, "nine", "#/1"]
        ]);
    });
    it("should callback for object and all properties", () => {
        const calls = [];
        core.each({ a: 5, b: 9 }, (...args) => calls.push(args), { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } });
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "object", properties: { a: { type: "number" }, b: { type: "number" } } }, { a: 5, b: 9 }, "#"],
            [{ type: "number" }, 5, "#/a"],
            [{ type: "number" }, 9, "#/b"]
        ]);
    });
});
