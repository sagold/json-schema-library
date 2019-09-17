/* eslint quote-props: 0 */
const expect = require("chai").expect;
const getTemplate = require("../../lib/getTemplate");
const Core = require("../../lib/cores/Draft04");


// @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
describe("getTemplate", () => {

    let core;
    before(() => (core = new Core()));

    it("should set an empty string if no default value is given", () => {
        core.setSchema({ type: "string" });
        const res = getTemplate(core);

        expect(res).to.deep.equal("");
    });

    it("should set the first enum option for a missing default", () => {
        core.setSchema({ type: "string", enum: ["first", "second"] });
        const res = getTemplate(core);

        expect(res).to.deep.equal("first");
    });


    describe("boolean", () => {
        it("should set default value for boolean", () => {
            core.setSchema({ type: "boolean", default: false });
            const res = getTemplate(core);

            expect(res).to.equal(false);
        });

        it("should not override given boolean if it is 'false'", () => {
            core.setSchema({ type: "boolean", default: true });
            const res = getTemplate(core, false);

            expect(res).to.equal(false);
        });

        it("should not override given boolean if it is 'true'", () => {
            core.setSchema({ type: "boolean", default: false });
            const res = getTemplate(core, true);

            expect(res).to.equal(true);
        });
    });


    describe("object", () => {
        describe("properties", () => {

            it("should return defined properties of object", () => {
                core.setSchema({ type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "", second: 0 });
            });

            it("should not fail on falsy input data", () => {
                core.setSchema({ type: "object",
                    properties: {
                        first: { type: "boolean", default: true },
                        second: { type: "boolean", default: false }
                    }
                });
                const res = getTemplate(core, { first: false, second: true });

                expect(res).to.deep.equal({ first: false, second: true });
            });

            it("should return default object if defined", () => {
                core.setSchema({ type: "object",
                    properties: { first: { type: "string" }, second: { type: "number" } },
                    "default": { first: "john", second: 4 }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should not override given default values", () => {
                core.setSchema({ type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should extend given template data by default values", () => {
                core.setSchema({ type: "object",
                    properties: {
                        first: { type: "string", "default": "jane" },
                        second: { type: "number" }
                    },
                    "default": { first: "john", second: 4 }

                });
                const res = getTemplate(core, { second: 8 });

                expect(res).to.deep.equal({ first: "john", second: 8 });
            });
        });


        describe("$ref", () => {

            it("should resolve $ref in object schema", () => {
                core.setSchema({ type: "object",
                    properties: { first: { $ref: "#/definition/first" } },
                    definition: { first: { type: "string", default: "john" } }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john" });
            });
        });


        describe("oneOf", () => {

            it("should return template of first oneOf schema", () => {
                core.setSchema({ type: "object",
                    oneOf: [
                        { type: "object", properties: { title: { type: "string", default: "jane" } } },
                        { type: "object", properties: { value: { type: "number" } } }
                    ]
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ title: "jane" });
            });

            it("should return template of for matching oneOf schema", () => {
                core.setSchema({ type: "object",
                    oneOf: [
                        { type: "object", properties: {
                            value: { type: "string", default: "jane" } }
                        },
                        { type: "object", properties: {
                            value: { type: "number" }, test: { type: "string", default: "test" } }
                        }
                    ]
                });
                const res = getTemplate(core, { value: 111 });

                expect(res).to.deep.equal({ value: 111, test: "test" });
            });
        });


        describe("allOf", () => {

            it("should create template for merged allOf schema", () => {
                core.setSchema({ type: "object",
                    allOf: [
                        {
                            properties: {
                                name: { type: "string", default: "jane" }
                            }
                        },
                        {
                            properties: {
                                stage: { type: "string", default: "test" }
                            }
                        }
                    ]
                });
                const res = getTemplate(core, { name: "john" });

                expect(res).to.deep.equal({ name: "john", stage: "test" });
            });
        });


        describe("anyOf", () => {

            it("should create template for first anyOf schema", () => {
                core.setSchema({ type: "object",
                    anyOf: [
                        {
                            properties: {
                                name: { type: "string", default: "jane" },
                                stage: { type: "string", default: "develop" }
                            }
                        },
                        {
                            properties: {
                                stage: { type: "number", default: 0 }
                            }
                        }
                    ]
                });
                const res = getTemplate(core, { name: "john" });

                expect(res).to.deep.equal({ name: "john", stage: "develop" });
            });
        });
    });


    describe("array", () => {
        describe("items:Object", () => {

            it("should return empty array if minItems = 0", () => {
                core.setSchema({ type: "array",
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal([]);
            });

            it("should return array with minItems", () => {
                core.setSchema({ type: "array",
                    minItems: 3,
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(3);
                expect(res).to.deep.equal([false, false, false]);
            });

            it("should return default array", () => {
                core.setSchema({ type: "array",
                    minItems: 1,
                    "default": [true],
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([true]);
            });

            it("should not override given default values", () => {
                core.setSchema({ type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string",
                        "default": "elvis"
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                core.setSchema({ type: "array",
                    minItems: 2,
                    "default": ["abba", "doors"],
                    items: {
                        type: "string"
                    }
                });
                const res = getTemplate(core, ["elvis"]);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["elvis", "doors"]);
            });
        });


        describe("items:Array", () => {
            // - Tuple validation is useful when the array is a collection of items where each has a different schema
            // and the ordinal index of each item is meaningful.
            // - It’s ok to not provide all of the items:
            // https://spacetelescope.github.io/understanding-json-schema/reference/array.html#tuple-validation
            it("should return items in given order", () => {
                core.setSchema({ type: "array",
                    minItems: 2,
                    items: [
                        { type: "string" },
                        { type: "boolean" }
                    ]
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal(["", false]);
            });

            it("should replace input data", () => {
                core.setSchema({ type: "array",
                    minItems: 2,
                    items: [
                        { type: "object" },
                        { type: "boolean", "default": true }
                    ]
                });
                const res = getTemplate(core, [43]);

                expect(res).to.deep.equal([{}, true]);
            });

            it("should convert input data for strings", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: [{ type: "string" }]
                });
                const res = getTemplate(core, [43]);

                expect(res).to.deep.equal(["43"]);
            });

            it("should convert input data for numbers", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(core, ["43"]);

                expect(res).to.deep.equal([43]);
            });

            it("should return default value for invalid number", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(core, ["asd"]);

                expect(res).to.deep.equal([0]);
            });

            it("should convert input data for booleans", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(core, ["false"]);

                expect(res).to.deep.equal([false]);
            });

            it("should return default value for invalid boolean", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(core, ["43"]);

                expect(res).to.deep.equal([false]);
            });
        });


        describe("items.oneOf", () => {

            it("should return template of first oneOf schema", () => {
                core.setSchema({ type: "array", minItems: 1,
                    items: {
                        oneOf: [
                            { type: "string", "default": "target" },
                            { type: "number", "default": 9 }
                        ]
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal(["target"]);
            });

            it("should merge with input data", () => {
                core.setSchema({
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
                });

                const res = getTemplate(core, [{ subtitle: "Subtitel" }]);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([{ title: "Standardtitel", subtitle: "Subtitel" }]);
            });
        });


        describe("items.allOf", () => {

            it("should create template for merged allOf schema", () => {
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "object",
                        allOf: [
                            {
                                properties: {
                                    title: { type: "string", default: "title" }
                                }
                            },
                            {
                                properties: {
                                    caption: { type: "string", default: "caption" }
                                }
                            }
                        ]
                    }
                });

                const res = getTemplate(core, [{ "title": "given-title" }]);
                expect(res).to.deep.equal([
                    { "title": "given-title", "caption": "caption" },
                    { "title": "title", "caption": "caption" }
                ]);
            });
        });


        describe("items.anyOf", () => {

            it("should create template for first anyOf schema", () => {
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "object",
                        anyOf: [
                            {
                                properties: {
                                    title: { type: "string", default: "title" }
                                }
                            },
                            {
                                properties: {
                                    caption: { type: "string", default: "caption" }
                                }
                            }
                        ]
                    }
                });

                const res = getTemplate(core, [{ "title": "given-title" }]);
                expect(res).to.deep.equal([
                    { "title": "given-title" },
                    { "title": "title" }
                ]);
            });
        });
    });


    describe("oneOf", () => {

        it("should return first schema for mixed types", () => {
            core.setSchema({
                oneOf: [
                    { type: "string", "default": "jane" },
                    { type: "number" }
                ]
            });
            const res = getTemplate(core);

            expect(res).to.deep.equal("jane");
        });
    });
});
