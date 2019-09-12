const expect = require("chai").expect;
const step = require("../../lib/step");

const Core = require("../../lib/cores/Draft04");


describe("step", () => {

    let core;
    before(() => (core = new Core()));

    it("should return an error for unknown types", () => {
        const res = step(core, 0, { type: "unknown" }, {});
        expect(res).to.be.an("error");
    });


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
                oneOf: [
                    { type: "object", properties: { title: { type: "string" } } },
                    { type: "object", properties: { title: { type: "number" } } }
                ]
            }, { title: 4 });

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching oneOf, for objects missing properties", () => {
            const res = step(core, "title", {
                oneOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }, { title: 4, test: 2 });

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching anyOf", () => {
            const res = step(core, "title", {
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } }
                ]
            }, { title: 4, test: 2 });

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return combined anyOf schema", () => {
            const res = step(core, "title", {
                anyOf: [
                    { type: "object", additionalProperties: { type: "string" } },
                    { type: "object", additionalProperties: { type: "number" } },
                    { type: "object", additionalProperties: { minimum: 2 } }
                ]
            }, { title: 4, test: 2 });

            expect(res).to.deep.eq({ type: "number", minimum: 2 });
        });

        it("should return matching allOf schema", () => {
            const res = step(core, "title", {
                allOf: [
                    { type: "object" },
                    { additionalProperties: { type: "number" } }
                ]
            }, { title: 4, test: 2 });

            expect(res).to.deep.eq({ type: "number" });
        });

        it("should return matching patternProperty", () => {
            const res = step(core, "second", {
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                }
            });

            expect(res).to.deep.eq({ type: "string", id: "second" });
        });

        it("should return additionalProperties schema for not matching patternProperty", () => {
            const res = step(core, "third", {
                type: "object",
                patternProperties: {
                    "^first$": { type: "number", id: "first" },
                    "^second$": { type: "string", id: "second" }
                },
                additionalProperties: { type: "object" }
            });

            expect(res).to.deep.eq({ type: "object" });
        });
    });

    describe("oneof", () => {

        it("should return matching schema", () => {
            const res = step(core, "title", {
                type: "object",
                properties: {
                    title: {
                        oneOf: [
                            { type: "string", title: "Zeichenkette" },
                            { type: "number", title: "Zahl" }
                        ]
                    }
                }
            }, { title: 111 });

            // @special case: where a schema is selected and the original schema maintained.
            // Remove the original and its flag
            delete res.oneOfSchema;
            delete res.variableSchema;
            expect(res).to.deep.eq({ type: "number", title: "Zahl" });
        });

    });

    describe("array", () => {

        it("should return an error for invalid array schema", () => {
            const res = step(core, 0, { type: "array" }, []);
            expect(res).to.be.an("error");
        });

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

        it("should return matching anyOf", () => {
            const res = step(core, 1, {
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } }
                    ]
                }
            }, [{ title: "two" }, { title: 4 }]);

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "number" } } });
        });

        it("should return combined anyOf schema", () => {
            const res = step(core, 1, {
                items: {
                    anyOf: [
                        { type: "object", properties: { title: { type: "string" } } },
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 2 } } }
                    ]
                }
            }, [{ title: "two" }, { title: 4 }]);

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "number", minimum: 2 } } });
        });

        it("should return combined allOf schema", () => {
            const res = step(core, 1, {
                items: {
                    allOf: [
                        { type: "object", properties: { title: { type: "number" } } },
                        { type: "object", properties: { title: { minimum: 3 } } }
                    ]
                }
            }, [{ title: "two" }, { title: 4 }]);

            expect(res).to.deep.eq({ type: "object", properties: { title: { type: "number", minimum: 3 } } });
        });

        it("should return a generated schema with additionalItems", () => {
            const res = step(core, 1, {
                type: "array",
                additionalItems: true
            }, ["3", 2]);

            expect(res.type).to.eq("number");
        });
    });
});
