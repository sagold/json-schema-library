const expect = require("chai").expect;
const step = require("../../lib/step");


describe("jsonschema.step", () => {

    describe("object", () => {

        it("should return object property", () => {
            const res = step("title", {
                type: "object",
                properties: {
                    title: { type: "string" }
                }
            });

            expect(res).to.deep.eq({ type: "string" });
        });

        it("should return matching oneOf", () => {
            const res = step("title", {
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
            const res = step(0, {
                type: "array",
                items: {
                    title: { type: "string" }
                }
            });

            expect(res).to.deep.eq({ title: { type: "string" } });
        });

        it("should return item at index", () => {
            const res = step(1, {
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
            const res = step(0, {
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
