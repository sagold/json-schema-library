const expect = require("chai").expect;
const step = require("../../lib/step");

const Core = require("../../lib/cores/draft04");


describe("step", () => {

    let core;
    before(() => (core = new Core()));


    describe("object", () => {

        it("should return object property", () => {
            const res = step(core, "title", {
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            });

            expect(res).to.deep.eq({ type: "string" });
        });

        it("should return matching oneOf", () => {
            const res = step(core, "title", {
                type: "object",
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { title: { type: "number" } } }
                ]
            }, { title: 4 });

            expect(res).to.deep.eq({ type: "number" });
        });
    });

    describe("array", () => {

        it("should return item property", () => {
            const res = step(core, 0, {
                type: "array",
                items: {
                    type: "string"
                }
            });

            expect(res).to.deep.eq({ type: "string" });
        });

        it("should return item at index", () => {
            const res = step(core, 1, {
                type: "array",
                items: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" }
                ]
            }, ["3", 2]);

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching item in oneOf", () => {
            const res = step(core, 0, {
                type: "array",
                items: {
                    oneOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }, [{ title: 2 }]);

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "number" } } });
        });
    });
});
