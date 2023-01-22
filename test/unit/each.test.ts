import { expect } from "chai";
import { each } from "../../lib/each";
import { Draft04 as Core } from "../../lib/draft04";

describe("each", () => {
    let draft: Core;
    before(() => {
        draft = new Core();
        // @ts-ignore
        each.draft = draft;
    });

    it("should call callback with schema, value and pointer", () => {
        const calls: [unknown, unknown, string][] = [];
        draft.each(5, (...args: [unknown, unknown, string]) => calls.push(args), {
            type: "number"
        });

        expect(calls).to.have.length(1);
        expect(calls[0][0]).to.deep.eq({ type: "number" });
        expect(calls[0][1]).to.eq(5);
        expect(calls[0][2]).to.eq("#");
    });

    it("should callback for array and all array items", () => {
        const calls: unknown[] = [];
        draft.each([5, 9], (...args: [unknown, unknown, string]) => calls.push(args), {
            type: "array",
            items: { type: "number" }
        });

        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: { type: "number" } }, [5, 9], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "number" }, 9, "#/1"]
        ]);
    });

    it("should callback for array and pick correct schema forEach item", () => {
        const calls: unknown[] = [];
        draft.each([5, "nine"], (...args: [unknown, unknown, string]) => calls.push(args), {
            type: "array",
            items: [{ type: "number" }, { type: "string" }]
        });

        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: [{ type: "number" }, { type: "string" }] }, [5, "nine"], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "string" }, "nine", "#/1"]
        ]);
    });

    it("should callback for object and all properties", () => {
        const calls: unknown[] = [];
        draft.each({ a: 5, b: 9 }, (...args: [unknown, unknown, string]) => calls.push(args), {
            type: "object",
            properties: { a: { type: "number" }, b: { type: "number" } }
        });

        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [
                { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } },
                { a: 5, b: 9 },
                "#"
            ],
            [{ type: "number" }, 5, "#/a"],
            [{ type: "number" }, 9, "#/b"]
        ]);
    });

    it("should resolve root reference", () => {
        const calls: any[] = [];
        const draft = new Core({
            $ref: "#/definitions/value",
            definitions: {
                value: { type: "object", properties: { title: { type: "string" } } }
            }
        });
        draft.each({ title: "third" }, (schema) => calls.push(schema));
        expect(calls).to.have.length(2);
        expect(calls[0].type).to.equal("object");
        expect(calls[1].type).to.equal("string");
    });
});
