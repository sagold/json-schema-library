/* eslint quote-props: 0 */
import { expect } from "chai";
import getTemplate from "../../lib/getTemplate";
import { Draft04 as Core } from "../../lib/draft04";

// @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
describe("getTemplate", () => {
    let core: Core;
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

    it("should support null types", () => {
        core.setSchema({ type: "null" });
        const res = getTemplate(core);

        expect(res).to.deep.equal(null);
    });

    it("should not modify input schema", () => {
        const schema = {
            type: "object",
            properties: {
                title: { type: "string", default: "title" },
                list: {
                    type: "array",
                    items: {
                        allOf: [
                            { type: "object" },
                            {
                                properties: {
                                    index: { type: "number", default: 4 }
                                }
                            }
                        ]
                    }
                },
                author: {
                    anyOf: [
                        { type: "string", default: "jane" },
                        { type: "string", default: "john" }
                    ]
                },
                source: {
                    type: "string",
                    enum: ["dpa", "getty"]
                }
            }
        };
        const originalSchema = JSON.stringify(schema);
        core.setSchema(schema);
        getTemplate(core, {}, schema);
        expect(JSON.stringify(schema)).to.deep.equal(originalSchema);
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
                core.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "", second: 0 });
            });

            it("should not fail on falsy input data", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "boolean", default: true },
                        second: { type: "boolean", default: false }
                    }
                });
                const res = getTemplate(core, { first: false, second: true });

                expect(res).to.deep.equal({ first: false, second: true });
            });

            it("should return default object if defined", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should not override given default values", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string", default: "jane" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should extend given template data by default values", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string", default: "jane" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(core, { second: 8 });

                expect(res).to.deep.equal({ first: "john", second: 8 });
            });
        });

        describe("$ref", () => {
            const settings = require("../../lib/config/settings");
            const initialValue = settings.GET_TEMPLATE_RECURSION_LIMIT;
            before(() => (settings.GET_TEMPLATE_RECURSION_LIMIT = 1));
            after(() => (settings.GET_TEMPLATE_RECURSION_LIMIT = initialValue));

            it("should resolve $ref in object schema", () => {
                core.setSchema({
                    type: "object",
                    properties: { first: { $ref: "#/definition/first" } },
                    definition: { first: { type: "string", default: "john" } }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ first: "john" });
            });

            it("should follow $ref once", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        value: { type: "string", default: "node" },
                        nodes: {
                            type: "array",
                            minItems: 1,
                            items: {
                                $ref: "#"
                            }
                        }
                    }
                });
                const res = core.getTemplate({});

                expect(res).to.deep.equal({
                    value: "node",
                    nodes: [
                        {
                            value: "node",
                            nodes: []
                        }
                    ]
                });
            });

            // iteration depth is 1, input-depth is 2 => still add template to depth 2
            it("should respect depth of input data in $ref-resolution", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        value: { type: "string", default: "node" },
                        nodes: {
                            type: "array",
                            minItems: 1,
                            items: {
                                $ref: "#"
                            }
                        }
                    }
                });

                const res = core.getTemplate({
                    nodes: [
                        {
                            value: "input-node"
                        },
                        {
                            nodes: [
                                {
                                    nodes: []
                                }
                            ]
                        }
                    ]
                });

                expect(res).to.deep.equal({
                    value: "node",
                    nodes: [
                        {
                            value: "input-node",
                            nodes: []
                        },
                        {
                            value: "node",
                            nodes: [
                                {
                                    value: "node",
                                    nodes: [
                                        {
                                            value: "node",
                                            nodes: []
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                });
            });

            // should not follow $ref to infinity
            it("should create template of draft04", () => {
                core.setSchema(require("../../remotes/draft04.json"));
                const res = core.getTemplate({});
                // console.log("RESULT\n", JSON.stringify(res, null, 2));
                expect(Object.prototype.toString.call(res)).to.eq("[object Object]");
            });

            it("should support null type properties", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        nullType: { type: "null" }
                    }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ nullType: null });
            });
        });

        describe("oneOf", () => {
            it("should return template of first oneOf schema", () => {
                core.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            properties: {
                                title: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            properties: { value: { type: "number" } }
                        }
                    ]
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal({ title: "jane" });
            });

            it("should return template of for matching oneOf schema", () => {
                core.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            properties: {
                                value: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            properties: {
                                value: { type: "number" },
                                test: { type: "string", default: "test" }
                            }
                        }
                    ]
                });
                const res = getTemplate(core, { value: 111 });

                expect(res).to.deep.equal({ value: 111, test: "test" });
            });
        });

        describe("allOf", () => {
            it("should create template for merged allOf schema", () => {
                core.setSchema({
                    type: "object",
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
                core.setSchema({
                    type: "object",
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

        // <= draft07
        describe("dependencies", () => {
            it("should create template for valid dependency", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        test: { type: "string", default: "tested value" }
                    },
                    dependencies: {
                        test: {
                            properties: {
                                additionalValue: { type: "string", default: "additional" }
                            }
                        }
                    }
                });
                const res = getTemplate(core);
                expect(res).to.deep.equal({ test: "tested value", additionalValue: "additional" });
            });

            it("should not change passed value of dependency", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        test: { type: "string", default: "tested value" }
                    },
                    dependencies: {
                        test: {
                            properties: {
                                additionalValue: { type: "string", default: "additional" }
                            }
                        }
                    }
                });
                const res = getTemplate(core, { additionalValue: "input value" });
                expect(res).to.deep.equal({
                    test: "tested value",
                    additionalValue: "input value"
                });
            });

            it("should not create template for non matching dependency", () => {
                core.setSchema({
                    type: "object",
                    properties: {
                        test: { type: "string", default: "tested value" }
                    },
                    dependencies: {
                        unknown: {
                            properties: {
                                additionalValue: { type: "string", default: "additional" }
                            }
                        }
                    }
                });
                const res = getTemplate(core);
                expect(res).to.deep.equal({ test: "tested value" });
            });
        });
    });

    describe("array", () => {
        describe("items:Object", () => {
            it("should return empty array if minItems = 0", () => {
                core.setSchema({
                    type: "array",
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal([]);
            });

            it("should return array with minItems", () => {
                core.setSchema({
                    type: "array",
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
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    default: [true],
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([true]);
            });

            it("should not override given default values", () => {
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: {
                        type: "string",
                        default: "elvis"
                    }
                });
                const res = getTemplate(core);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    default: ["abba", "doors"],
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
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "string" }, { type: "boolean" }]
                });
                const res = getTemplate(core);

                expect(res).to.deep.equal(["", false]);
            });

            it("should replace input data", () => {
                core.setSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "object" }, { type: "boolean", default: true }]
                });
                const res = getTemplate(core, [43]);

                expect(res).to.deep.equal([{}, true]);
            });

            it("should convert input data for strings", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "string" }]
                });
                const res = getTemplate(core, [43]);

                expect(res).to.deep.equal(["43"]);
            });

            it("should convert input data for numbers", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(core, ["43"]);

                expect(res).to.deep.equal([43]);
            });

            it("should return default value for invalid number", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(core, ["asd"]);

                expect(res).to.deep.equal([0]);
            });

            it("should convert input data for booleans", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(core, ["false"]);

                expect(res).to.deep.equal([false]);
            });

            it("should return default value for invalid boolean", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(core, ["43"]);

                expect(res).to.deep.equal([false]);
            });
        });

        describe("items.oneOf", () => {
            it("should return template of first oneOf schema", () => {
                core.setSchema({
                    type: "array",
                    minItems: 1,
                    items: {
                        oneOf: [
                            { type: "string", default: "target" },
                            { type: "number", default: 9 }
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
                                    notitle: {
                                        type: "string",
                                        default: "nottitle"
                                    }
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
                            { type: "number", default: 9 }
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
                                    caption: {
                                        type: "string",
                                        default: "caption"
                                    }
                                }
                            }
                        ]
                    }
                });

                const res = getTemplate(core, [{ title: "given-title" }]);
                expect(res).to.deep.equal([
                    { title: "given-title", caption: "caption" },
                    { title: "title", caption: "caption" }
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
                                    caption: {
                                        type: "string",
                                        default: "caption"
                                    }
                                }
                            }
                        ]
                    }
                });

                const res = getTemplate(core, [{ title: "given-title" }]);
                expect(res).to.deep.equal([{ title: "given-title" }, { title: "title" }]);
            });
        });
    });

    describe("oneOf", () => {
        it("should return first schema for mixed types", () => {
            core.setSchema({
                oneOf: [{ type: "string", default: "jane" }, { type: "number" }]
            });
            const res = getTemplate(core);

            expect(res).to.deep.equal("jane");
        });
    });

    describe("list of types", () => {
        it("should return first type of list for template", () => {
            core.setSchema({
                type: ["string", "object"]
            });
            const res = getTemplate(core);

            expect(res).to.deep.equal("");
        });

        it("should return input data", () => {
            core.setSchema({
                type: ["string", "object"]
            });
            const res = getTemplate(core, "title");

            expect(res).to.deep.equal("title");
        });

        it("should return type of default value if data is not given", () => {
            core.setSchema({
                type: ["string", "array", "object"],
                default: []
            });
            const res = getTemplate(core);

            expect(res).to.deep.equal([]);
        });
    });

    describe("templateOptions", () => {
        it("should not add optional properties", () => {
            const schema = {
                type: "object",
                required: ["list", "author"],
                properties: {
                    title: { type: "string", default: "title" },
                    list: {
                        type: "array",
                        items: {
                            allOf: [
                                { type: "object" },
                                {
                                    properties: {
                                        index: { type: "number", default: 4 }
                                    }
                                }
                            ]
                        }
                    },
                    author: {
                        anyOf: [
                            { type: "string", default: "jane" },
                            { type: "string", default: "john" }
                        ]
                    },
                    source: {
                        type: "string",
                        enum: ["dpa", "getty"]
                    }
                }
            };
            core.setSchema(schema);

            const template = getTemplate(core, {}, schema, {
                addOptionalProps: false
            });

            expect({ list: [], author: "jane" }).to.deep.equal(template);
        });
    });
});
