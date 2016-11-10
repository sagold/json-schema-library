const expect = require("chai").expect;
const each = require("../../lib/each");


describe("each", () => {

    it("should call callback with schema, value and pointer", () => {
        const calls = [];
        each(5, { type: "number" }, (...args) => {
            calls.push(args);
        });
        expect(calls).to.have.length(1);
        expect(calls[0][0]).to.deep.eq({ type: "number" });
        expect(calls[0][1]).to.eq(5);
        expect(calls[0][2]).to.eq("#");
    });

    it("should callback for array and all array items", () => {
        const calls = [];
        each([5, 9], { type: "array", items: { type: "number" } }, (...args) => {
            calls.push(args);
        });
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: { type: "number" } }, [5, 9], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "number" }, 9, "#/1"]
        ]);
    });

    it("should callback for array and pick correct schema forEach item", () => {
        const calls = [];
        each([5, "nine"], { type: "array", items: [{ type: "number" }, { type: "string" }] }, (...args) => {
            calls.push(args);
        });
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "array", items: [{ type: "number" }, { type: "string" }] }, [5, "nine"], "#"],
            [{ type: "number" }, 5, "#/0"],
            [{ type: "string" }, "nine", "#/1"]
        ]);
    });

    it("should callback for object and all properties", () => {
        const calls = [];
        each(
            { a: 5, b: 9 },
            { type: "object", properties: { a: { type: "number" }, b : { type: "number" } } },
            (...args) => {
                calls.push(args);
            }
        );
        expect(calls).to.have.length(3);
        expect(calls).to.deep.eq([
            [{ type: "object", properties: { a: { type: "number" }, b : { type: "number" } } }, { a: 5, b: 9 }, "#"],
            [{ type: "number" }, 5, "#/a"],
            [{ type: "number" }, 9, "#/b"]
        ]);
    });
});
