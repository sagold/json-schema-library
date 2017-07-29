/* eslint quote-props: 0 */
const expect = require("chai").expect;
const getTemplate = require("../../lib/getTemplate");
const Core = require("../../lib/cores/Draft04");


// @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
describe("getTemplate", () => {

    let core;
    before(() => (core = new Core()));

    it("should set an empty string if no default value is given", () => {
        core.rootSchema = { type: "string" };
        const res = getTemplate(core, core.rootSchema);

        expect(res).to.deep.equal("");
    });

    it("should set the first enum option for a missing default", () => {
        core.rootSchema = { type: "string", enum: ["first", "second"] };
        const res = getTemplate(core, core.rootSchema);

        expect(res).to.deep.equal("first");
    });

    describe("object", () => {

        describe(".properties", () => {

            it("should return defined properties of object", () => {
                core.rootSchema = { type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal({ first: "", second: 0 });
            });

            it("should return default object if defined", () => {
                core.rootSchema = { type: "object",
                    properties: { first: { type: "string" }, second: { type: "number" } },
                    "default": { first: "john", second: 4 }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should not override given default values", () => {
                core.rootSchema = { type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should extend given template data by default values", () => {
                core.rootSchema = { type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }

                };
                const res = getTemplate(core, core.rootSchema, { second: 8 });

                expect(res).to.deep.equal({ first: "john", second: 8 });
            });
        });

        describe("$ref", () => {

            it("should resolve $ref in object schema", () => {
                core.rootSchema = { type: "object",
                    properties: { first: { $ref: "#/definition/first" } },
                    definition: { first: { type: "string", default: "john" } }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal({ first: "john" });
            });

            // it("should prefer default over default in $ref", () => {
            //     core.rootSchema = { type: "object",
            //         properties: { first: { $ref: "#/definition/first", default: "asterix" } },
            //         definition: { first: { type: "string", default: "john" } }
            //     };
            //     const res = getTemplate(core, core.rootSchema);

            //     expect(res).to.deep.equal({ first: "asterix" });
            // });
        });


        describe(".oneOf", () => {

            it("should return template of first oneOf schema", () => {
                core.rootSchema = { type: "object",
                    oneOf: [
                        { type: "object", properties: { title: { type: "string", default: "jane" } } },
                        { type: "object", properties: { value: { type: "number" } } }
                    ]
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal({ title: "jane" });
            });

            it("should return template of for matching oneOf schema", () => {
                core.rootSchema = { type: "object",
                    oneOf: [
                        { type: "object", properties: {
                            value: { type: "string", default: "jane" } }
                        },
                        { type: "object", properties: {
                            value: { type: "number" }, test: { type: "string", default: "test" } }
                        }
                    ]
                };
                const res = getTemplate(core, core.rootSchema, { value: 111 });

                expect(res).to.deep.equal({ value: 111, test: "test" });
            });
        });
    });


    describe("array", () => {
        describe(".items:Object", () => {

            it("should return empty array if minItems = 0", () => {
                core.rootSchema = { type: "array",
                    items: {
                        type: "boolean"
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal([]);
            });

            it("should return array with minItems", () => {
                core.rootSchema = { type: "array",
                    minItems: 3,
                    items: {
                        type: "boolean"
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res.length).to.deep.equal(3);
                expect(res).to.deep.equal([false, false, false]);
            });

            it("should return default array", () => {
                core.rootSchema = { type: "array",
                    minItems: 1,
                    "default": [true],
                    items: {
                        type: "boolean"
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([true]);
            });

            it("should not override given default values", () => {
                core.rootSchema = { type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string",
                        "default": "elvis"
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                core.rootSchema = { type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string"
                    }
                };
                const res = getTemplate(core, core.rootSchema, ["elvis"]);

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
                core.rootSchema = { type: "array",
                    minItems: 2,
                    items: [
                        { type: "string" },
                        { type: "boolean" }
                    ]
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res).to.deep.equal(["", false]);
            });

            it("should not replace input data", () => {
                core.rootSchema = { type: "array",
                    minItems: 2,
                    items: [
                        { type: "string" },
                        { type: "boolean", "default": true }
                    ]
                };
                const res = getTemplate(core, core.rootSchema, [43]);

                expect(res).to.deep.equal([43, true]);
            });
        });

        describe(".items.oneOf", () => {

            it("should return template of first oneOf schema", () => {
                core.rootSchema = { type: "array", minItems: 1,
                    items: {
                        oneOf: [
                            { type: "string", "default": "target" },
                            { type: "number", "default": 9 }
                        ]
                    }
                };
                const res = getTemplate(core, core.rootSchema);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal(["target"]);
            });

            it("should merge with input data", () => {
                core.rootSchema = {
                    type: "array",
                    minItems: 1,
                    items: {
                        oneOf: [
                            {
                                type: "object",
                                properties: {
                                    notitle: { type: "string", default: "nottitle" }
                                }
                            },
                            {
                                type: "object",
                                properties: {
                                    title: {
                                        type: "string",
                                        default: "Standardtitel"
                                    },
                                    subtitle: {
                                        type: "string",
                                        default: "do not replace with"
                                    }
                                }
                            },
                            { type: "number", "default": 9 }
                        ]
                    }
                };

                const res = getTemplate(core, core.rootSchema, [{ subtitle: "Subtitel" }]);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([{ title: "Standardtitel", subtitle: "Subtitel" }]);
            });
        });
    });

    describe("oneOf", () => {

        it("should return first schema for mixed types", () => {
            core.rootSchema = {
                oneOf: [
                    { type: "string", "default": "jane" },
                    { type: "number" }
                ]
            };
            const res = getTemplate(core, core.rootSchema);

            expect(res).to.deep.equal("jane");
        });
    });
});
