const expect = require("chai").expect;
const getTemplate = require("../../lib/getTemplate");


// @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
describe("getTemplate", () => {

    describe("object", () => {
        describe(".properties", () => {

            it("should return defined properties of object", () => {
                const res = getTemplate({ type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    }
                });

                expect(res).to.deep.equal({ first: "", second: 0 });
            });

            it("should return default object if defined", () => {
                const res = getTemplate({ type: "object",
                    properties: { first: { type: "string" }, second: { type: "number" } },
                    "default": { first: "john", second: 4 }
                });

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should not override given default values", () => {
                const res = getTemplate({ type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }
                });

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should extend given template data by default values", () => {
                const res = getTemplate({ type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }

                }, { second: 8 });

                expect(res).to.deep.equal({ first: "john", second: 8 });
            });
        });

        describe("$ref", () => {

            it("should resolve $ref in object schema", () => {
                const res = getTemplate({ type: "object",
                    properties: { first: { $ref: "#/definition/first" } },
                    definition: { first: { type: "string", default: "john" } }
                });

                expect(res).to.deep.equal({ first: "john" });
            });

            it("should prefer default over default in $ref", () => {
                const res = getTemplate({ type: "object",
                    properties: { first: { $ref: "#/definition/first", default: "asterix" } },
                    definition: { first: { type: "string", default: "john" } }
                });

                expect(res).to.deep.equal({ first: "asterix" });
            });
        });

        describe(".oneOf", () => {

            it("should return template of first oneOf schema", () => {
                const res = getTemplate({ type: "object",
                    oneOf: [
                        { type: "object", properties: { title: { type: "string", "default": "jane" } } },
                        { type: "object", properties: { value: { type: "number" } } }
                    ]
                });

                expect(res).to.deep.equal({ title: "jane" });
            });
        });
    });


    describe("array", () => {
        describe(".items:Object", () => {

            it("should return empty array if minItems = 0", () => {
                const res = getTemplate({ type: "array",
                    items: {
                        type: "boolean"
                    }
                });

                expect(res).to.deep.equal([]);
            });

            it("should return array with minItems", () => {
                const res = getTemplate({ type: "array",
                    minItems: 3,
                    items: {
                        type: "boolean"
                    }
                });

                expect(res.length).to.deep.equal(3);
                expect(res).to.deep.equal([false, false, false]);
            });

            it("should return default array", () => {
                const res = getTemplate({ type: "array",
                    minItems: 1,
                    "default": [true],
                    items: {
                        type: "boolean"
                    }
                });

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([true]);
            });

            it("should not override given default values", () => {
                const res = getTemplate({ type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string",
                        "default": "elvis"
                    }
                });

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                const res = getTemplate({ type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string"
                    }
                }, ["elvis"]);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["elvis", "doors"]);
            });
        });

        describe(".items:Array", () => {
            // - Tuple validation is useful when the array is a collection of items where each has a different schema
            // and the ordinal index of each item is meaningful.
            // - It’s ok to not provide all of the items:
            // https://spacetelescope.github.io/understanding-json-schema/reference/array.html#tuple-validation
            it("should return items in given order", () => {
                const res = getTemplate({ type: "array",
                    minItems: 2,
                    items: [
                        { type: "string" },
                        { type: "boolean" }
                    ]
                });

                expect(res).to.deep.equal(["", false]);
            });

            it("should not replace input data", () => {
                const res = getTemplate({ type: "array",
                    minItems: 2,
                    items: [
                        { type: "string" },
                        { type: "boolean", "default": true }
                    ]
                }, [43]);

                expect(res).to.deep.equal([43, true]);
            });
        });

        describe(".items.oneOf", () => {

            it("should return template of first oneOf schema", () => {
                const res = getTemplate({ type: "array", minItems: 1,
                    items: {
                        oneOf: [
                            { type: "string", "default": "target" },
                            { type: "number", "default": 9 }
                        ]
                    }
                });

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal(["target"]);
            });
        });
    });
});
