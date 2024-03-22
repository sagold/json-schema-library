/* eslint quote-props: 0 */
import { expect } from "chai";
import getTemplate from "../../lib/getTemplate";
import { Draft04 } from "../../lib/draft04";

// @NOTE OneOf can be used to select required? https://github.com/epoberezkin/ajv/issues/134#issuecomment-190680773
describe("getTemplate", () => {
    let draft: Draft04;
    before(() => (draft = new Draft04()));

    it("should set an empty string if no default value is given", () => {
        draft.setSchema({ type: "string" });
        const res = getTemplate(draft);

        expect(res).to.deep.equal("");
    });

    it("should set the first enum option for a missing default", () => {
        draft.setSchema({ type: "string", enum: ["first", "second"] });
        const res = getTemplate(draft);

        expect(res).to.deep.equal("first");
    });

    it("should support null types", () => {
        draft.setSchema({ type: "null" });
        const res = getTemplate(draft);

        expect(res).to.deep.equal(null);
    });

    it("should support null type properties", () => {
        draft.setSchema({
            type: "object",
            required: ["nullType"],
            properties: {
                nullType: { type: "null" }
            }
        });
        const res = getTemplate(draft);

        expect(res).to.deep.equal({ nullType: null });
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
        draft.setSchema(schema);
        getTemplate(draft, {}, schema);
        expect(JSON.stringify(schema)).to.deep.equal(originalSchema);
    });

    describe("boolean", () => {
        it("should set default value for boolean", () => {
            draft.setSchema({ type: "boolean", default: false });
            const res = getTemplate(draft);

            expect(res).to.equal(false);
        });

        it("should not override given boolean if it is 'false'", () => {
            draft.setSchema({ type: "boolean", default: true });
            const res = getTemplate(draft, false);

            expect(res).to.equal(false);
        });

        it("should not override given boolean if it is 'true'", () => {
            draft.setSchema({ type: "boolean", default: false });
            const res = getTemplate(draft, true);

            expect(res).to.equal(true);
        });
    });

    describe("number", () => {
        it("should set default value for number", () => {
            draft.setSchema({ type: "number", default: 2 });
            const res = getTemplate(draft);

            expect(res).to.equal(2);
        });

        it("should not override given number", () => {
            draft.setSchema({ type: "number", default: 2 });
            const res = getTemplate(draft, 42);

            expect(res).to.equal(42);
        });
    });

    describe("integer", () => {
        it("should set default value for integer", () => {
            draft.setSchema({ type: "integer", default: 2 });
            const res = getTemplate(draft);

            expect(res).to.equal(2);
        });

        it("should not override given integer", () => {
            draft.setSchema({ type: "integer", default: 2 });
            const res = getTemplate(draft, 42);

            expect(res).to.equal(42);
        });
    });

    describe("object", () => {
        describe("properties", () => {
            it("should return defined properties of object", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    }
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal({ first: "", second: 0 });
            });

            it("should not fail on falsy input data", () => {
                draft.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "boolean", default: true },
                        second: { type: "boolean", default: false }
                    }
                });
                const res = getTemplate(draft, { first: false, second: true });

                expect(res).to.deep.equal({ first: false, second: true });
            });

            it("should return default object if defined", () => {
                draft.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should not override given default values", () => {
                draft.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string", default: "jane" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal({ first: "john", second: 4 });
            });

            it("should extend given template data by default values", () => {
                draft.setSchema({
                    type: "object",
                    properties: {
                        first: { type: "string", default: "jane" },
                        second: { type: "number" }
                    },
                    default: { first: "john", second: 4 }
                });
                const res = getTemplate(draft, { second: 8 });

                expect(res).to.deep.equal({ first: "john", second: 8 });
            });
        });

        describe("additionalProperties", () => {
            it("should not remove additional properties `additionalProperties=undefined`", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    }
                });

                const res = getTemplate(draft, { first: "first", second: 42 });
                expect(res).to.deep.equal({ first: "first", second: 42 });
            });

            it("should not remove additional properties `additionalProperties=true`", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    },
                    additionalProperties: true
                });

                const res = getTemplate(draft, { first: "first", second: 42 });
                expect(res).to.deep.equal({ first: "first", second: 42 });
            });

            it("should not remove non matching properties", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    },
                    additionalProperties: {
                        type: "string"
                    }
                });

                const res = getTemplate(draft, { first: "first", second: 42 });
                expect(res).to.deep.equal({ first: "first", second: 42 });
            });

            it("should not remove additional properties with `additionalProperties=false`", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    },
                    additionalProperties: false
                });

                const res = getTemplate(draft, { first: "first", second: 42 });
                expect(res).to.deep.equal({ first: "first", second: 42 });
            });

            it("should remove unmatched properties with option `removeInvalidData=true`", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    },
                    additionalProperties: false
                });

                const res = getTemplate(
                    draft,
                    { first: "first", second: 42, thrid: "third" },
                    draft.getSchema(),
                    { removeInvalidData: true }
                );
                expect(res).to.deep.equal({ first: "first" });
            });

            it("should remove invalid properties with option `removeInvalidData=true`", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first", "second"],
                    properties: {
                        first: { type: "string" }
                    },
                    additionalProperties: {
                        type: "number"
                    }
                });

                const res = getTemplate(
                    draft,
                    { first: "first", second: 42, third: "third", fourth: false },
                    draft.getSchema(),
                    {
                        removeInvalidData: true
                    }
                );
                expect(res).to.deep.equal({ first: "first", second: 42 });
            });
        });

        describe("$ref", () => {
            const settings = require("../../lib/config/settings");
            const initialValue = settings.GET_TEMPLATE_RECURSION_LIMIT;
            before(() => (settings.GET_TEMPLATE_RECURSION_LIMIT = 1));
            after(() => (settings.GET_TEMPLATE_RECURSION_LIMIT = initialValue));

            it("should resolve $ref in object schema", () => {
                draft.setSchema({
                    type: "object",
                    required: ["first"],
                    properties: { first: { $ref: "#/definition/first" } },
                    definition: { first: { type: "string", default: "john" } }
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal({ first: "john" });
            });

            it("should resolve $ref in items-array", () => {
                draft.setSchema({
                    type: "array",
                    items: [{ $ref: "#/definition/first" }],
                    definition: {
                        first: {
                            type: "object",
                            required: ["first"],
                            properties: {
                                first: { type: "string", default: "john" }
                            }
                        }
                    }
                });
                const res = draft.getTemplate([{}, {}]);
                expect(res).to.deep.equal([{ first: "john" }, {}]);
            });

            it("should follow $ref once", () => {
                draft.setSchema({
                    type: "object",
                    required: ["value", "nodes"],
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
                const res = draft.getTemplate({});

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
                draft.setSchema({
                    type: "object",
                    required: ["value", "nodes"],
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

                const res = draft.getTemplate({
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
                draft.setSchema(require("../../remotes/draft04.json"));
                const res = draft.getTemplate({});
                // console.log("RESULT\n", JSON.stringify(res, null, 2));
                expect(Object.prototype.toString.call(res)).to.eq("[object Object]");
            });
        });

        describe("oneOf", () => {
            it("should return template of first oneOf schema", () => {
                draft.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            required: ["title"],
                            properties: {
                                title: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            required: ["value"],
                            properties: { value: { type: "number" } }
                        }
                    ]
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal({ title: "jane" });
            });

            it("should extend empty object with first oneOf schema", () => {
                draft.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            required: ["title"],
                            properties: {
                                title: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            required: ["value"],
                            properties: { value: { type: "number" } }
                        }
                    ]
                });
                const res = getTemplate(draft, {});

                expect(res).to.deep.equal({ title: "jane" });
            });

            it("should return template of matching oneOf schema", () => {
                draft.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            type: "object",
                            required: ["value"],
                            properties: {
                                value: { type: "string", default: "jane" }
                            }
                        },
                        {
                            type: "object",
                            required: ["value", "test"],
                            properties: {
                                value: { type: "number" },
                                test: { type: "string", default: "test" }
                            }
                        }
                    ]
                });
                const res = getTemplate(draft, { value: 111 });

                expect(res).to.deep.equal({ value: 111, test: "test" });
            });

            it("should return input value if no oneOf-schema matches ", () => {
                draft.setSchema({
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
                const res = getTemplate(draft, { value: ["keep-me"] });

                expect(res).to.deep.equal({ value: ["keep-me"] });
            });

            it("should not require object type definition in oneOf schemas", () => {
                draft.setSchema({
                    type: "object",
                    oneOf: [
                        {
                            required: ["type"],
                            properties: {
                                type: { const: "header" }
                            }
                        },
                        {
                            required: ["type"],
                            properties: {
                                type: { const: "paragraph" }
                            }
                        }
                    ]
                });

                const res = getTemplate(draft, { type: "paragraph" });
                expect(res).to.deep.equal({ type: "paragraph" });
            });
        });

        describe("allOf", () => {
            it("should create template for merged allOf schema", () => {
                draft.setSchema({
                    type: "object",
                    allOf: [
                        {
                            required: ["name"],
                            properties: {
                                name: { type: "string", default: "jane" }
                            }
                        },
                        {
                            required: ["stage"],
                            properties: {
                                stage: { type: "string", default: "test" }
                            }
                        }
                    ]
                });
                const res = getTemplate(draft, { name: "john" });

                expect(res).to.deep.equal({ name: "john", stage: "test" });
            });
        });

        describe("anyOf", () => {
            it("should create template for first anyOf schema", () => {
                draft.setSchema({
                    type: "object",
                    anyOf: [
                        {
                            required: ["name", "stage"],
                            properties: {
                                name: { type: "string", default: "jane" },
                                stage: { type: "string", default: "develop" }
                            }
                        },
                        {
                            required: ["stage"],
                            properties: {
                                stage: { type: "number", default: 0 }
                            }
                        }
                    ]
                });
                const res = getTemplate(draft, { name: "john" });

                expect(res).to.deep.equal({ name: "john", stage: "develop" });
            });
        });

        // draft07 (backwards compatible)
        describe("dependencies", () => {
            describe("option: `additionalProps: false`", () => {
                const TEMPLATE_OPTIONS = { addOptionalProps: false };
                describe("dependency required", () => {
                    it("should not add dependency if it is not required", () => {
                        draft.setSchema({
                            type: "object",
                            properties: {
                                trigger: { type: "string" },
                                dependency: { type: "string", default: "default" }
                            },
                            dependencies: {
                                trigger: ["dependency"]
                            }
                        });

                        const res = getTemplate(draft, {}, draft.getSchema(), TEMPLATE_OPTIONS);
                        expect(res).to.deep.equal({});
                    });

                    it("should add dependency if triggered as required", () => {
                        draft.setSchema({
                            type: "object",
                            properties: {
                                trigger: { type: "string" },
                                dependency: { type: "string", default: "default" }
                            },
                            dependencies: {
                                trigger: ["dependency"]
                            }
                        });

                        const res = getTemplate(
                            draft,
                            { trigger: "yes" },
                            draft.getSchema(),
                            TEMPLATE_OPTIONS
                        );
                        expect(res).to.deep.equal({ trigger: "yes", dependency: "default" });
                    });

                    it("should add dependency if initially triggered as required", () => {
                        draft.setSchema({
                            type: "object",
                            required: ["trigger"],
                            properties: {
                                trigger: { type: "string" },
                                dependency: { type: "string", default: "default" }
                            },
                            dependencies: {
                                trigger: ["dependency"]
                            }
                        });

                        const res = getTemplate(draft, {}, draft.getSchema(), TEMPLATE_OPTIONS);
                        expect(res).to.deep.equal({ trigger: "", dependency: "default" });
                    });
                });

                describe("dependency schema", () => {
                    it("should not add dependency from schema if it is not required", () => {
                        draft.setSchema({
                            type: "object",
                            properties: {
                                trigger: { type: "string" }
                            },
                            dependencies: {
                                trigger: {
                                    properties: {
                                        dependency: { type: "string", default: "default" }
                                    }
                                }
                            }
                        });

                        const res = getTemplate(draft, {}, draft.getSchema(), TEMPLATE_OPTIONS);
                        expect(res).to.deep.equal({});
                    });

                    it("should add dependency from schema if triggered as required", () => {
                        draft.setSchema({
                            type: "object",
                            properties: {
                                trigger: { type: "string" }
                            },
                            dependencies: {
                                trigger: {
                                    required: ["dependency"],
                                    properties: {
                                        dependency: { type: "string", default: "default" }
                                    }
                                }
                            }
                        });

                        const res = getTemplate(
                            draft,
                            { trigger: "yes" },
                            draft.getSchema(),
                            TEMPLATE_OPTIONS
                        );
                        expect(res).to.deep.equal({ trigger: "yes", dependency: "default" });
                    });
                });
            });

            describe("option: `additionalProps: true`", () => {
                it("should create template for valid dependency", () => {
                    draft.setSchema({
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
                    const res = getTemplate(draft, undefined, draft.getSchema(), {
                        addOptionalProps: true
                    });
                    expect(res).to.deep.equal({
                        test: "tested value",
                        additionalValue: "additional"
                    });
                });

                it("should not change passed value of dependency", () => {
                    draft.setSchema({
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
                    const res = getTemplate(
                        draft,
                        { additionalValue: "input value" },
                        draft.getSchema(),
                        { addOptionalProps: true }
                    );
                    expect(res).to.deep.equal({
                        test: "tested value",
                        additionalValue: "input value"
                    });
                });

                it("should not create data for non matching dependency", () => {
                    draft.setSchema({
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
                    const res = getTemplate(draft, undefined, draft.getSchema(), {
                        addOptionalProps: true
                    });
                    expect(res).to.deep.equal({ test: "tested value" });
                });
            });
        });
    });

    describe("array", () => {
        describe("items:Object", () => {
            it("should return empty array if minItems = 0", () => {
                draft.setSchema({
                    type: "array",
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal([]);
            });

            it("should return array with minItems", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 3,
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(draft);

                expect(res.length).to.deep.equal(3);
                expect(res).to.deep.equal([false, false, false]);
            });

            it("should return default array", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    default: [true],
                    items: {
                        type: "boolean"
                    }
                });
                const res = getTemplate(draft);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([true]);
            });

            it("should return default array even if minItems is not set", () => {
                draft.setSchema({
                    type: "array",
                    default: ["a", "b"],
                    items: {
                        type: "string"
                    }
                });
                const res = getTemplate(draft);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["a", "b"]);
            });

            it("should return default array if part of object", () => {
                draft.setSchema({
                    type: "object",
                    required: ["list"],
                    properties: {
                        list: {
                            type: "array",
                            default: ["a", "b"],
                            items: {
                                type: "string"
                            }
                        }
                    }
                });
                const res = getTemplate(draft);

                expect(res.list.length).to.deep.equal(2);
                expect(res.list).to.deep.equal(["a", "b"]);
            });

            it("should not override given default values", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: {
                        type: "string",
                        default: "elvis"
                    }
                });
                const res = getTemplate(draft);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["abba", "doors"]);
            });

            it("should extend given template data by default values", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    default: ["abba", "doors"],
                    items: {
                        type: "string"
                    }
                });
                const res = getTemplate(draft, ["elvis"]);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal(["elvis", "doors"]);
            });

            it("should extend all input objects by missing properties", () => {
                draft.setSchema({
                    type: "array",
                    default: ["abba", "doors"],
                    items: {
                        type: "object",
                        required: ["first", "second"],
                        properties: {
                            first: { type: "string", default: "first" },
                            second: { type: "string", default: "second" }
                        }
                    }
                });
                const res = draft.getTemplate([
                    {
                        first: "user input"
                    },
                    {}
                ]);

                expect(res.length).to.deep.equal(2);
                expect(res).to.deep.equal([
                    {
                        first: "user input",
                        second: "second"
                    },
                    {
                        first: "first",
                        second: "second"
                    }
                ]);
            });
        });

        describe("items:Array", () => {
            // - Tuple validation is useful when the array is a collection of items where each has a different schema
            // and the ordinal index of each item is meaningful.
            // - It’s ok to not provide all of the items:
            // https://spacetelescope.github.io/understanding-json-schema/reference/array.html#tuple-validation
            it("should return items in given order", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "string" }, { type: "boolean" }]
                });
                const res = getTemplate(draft);

                expect(res).to.deep.equal(["", false]);
            });

            it("should replace input data", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    items: [{ type: "object" }, { type: "boolean", default: true }]
                });
                const res = getTemplate(draft, [43]);

                expect(res).to.deep.equal([{}, true]);
            });

            it("should convert input data for strings", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "string" }]
                });
                const res = getTemplate(draft, [43]);

                expect(res).to.deep.equal(["43"]);
            });

            it("should convert input data for numbers", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(draft, ["43"]);

                expect(res).to.deep.equal([43]);
            });

            it("should return default value for invalid number", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "number" }]
                });
                const res = getTemplate(draft, ["asd"]);

                expect(res).to.deep.equal([0]);
            });

            it("should convert input data for booleans", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(draft, ["false"]);

                expect(res).to.deep.equal([false]);
            });

            it("should return default value for invalid boolean", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: [{ type: "boolean" }]
                });
                const res = getTemplate(draft, ["43"]);

                expect(res).to.deep.equal([false]);
            });
        });

        describe("items.oneOf", () => {
            it("should return template of first oneOf schema", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: {
                        oneOf: [
                            { type: "string", default: "target" },
                            { type: "number", default: 9 }
                        ]
                    }
                });
                const res = getTemplate(draft);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal(["target"]);
            });

            it("should merge with input data", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 1,
                    items: {
                        oneOf: [
                            {
                                type: "object",
                                required: ["notitle"],
                                properties: {
                                    notitle: {
                                        type: "string",
                                        default: "nottitle"
                                    }
                                }
                            },
                            {
                                type: "object",
                                required: ["title", "subtitle"],
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

                const res = getTemplate(draft, [{ subtitle: "Subtitel" }]);

                expect(res.length).to.deep.equal(1);
                expect(res).to.deep.equal([{ title: "Standardtitel", subtitle: "Subtitel" }]);
            });

            it("should not remove invalid oneOf schema if 'removeInvalidData' is unset", () => {
                draft.setSchema({
                    type: "object",
                    properties: {
                        filter: {
                            $ref: "#/definitions/filter"
                        }
                    },
                    definitions: {
                        filter: {
                            type: "array",
                            items: {
                                oneOf: [
                                    {
                                        type: "object",
                                        properties: {
                                            op: {
                                                const: "in"
                                            },
                                            property: { type: "string", minLength: 1 }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                });
                const res = getTemplate(draft, { filter: [{ op: "möp" }] }, draft.getSchema());
                expect(res).to.deep.equal({ filter: [{ op: "möp" }] });
            });
        });

        describe("items.allOf", () => {
            it("should create template for merged allOf schema", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "object",
                        allOf: [
                            {
                                required: ["title"],
                                properties: {
                                    title: { type: "string", default: "title" }
                                }
                            },
                            {
                                required: ["caption"],
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

                const res = getTemplate(draft, [{ title: "given-title" }]);
                expect(res).to.deep.equal([
                    { title: "given-title", caption: "caption" },
                    { title: "title", caption: "caption" }
                ]);
            });
        });

        describe("items.anyOf", () => {
            it("should create template for first anyOf schema", () => {
                draft.setSchema({
                    type: "array",
                    minItems: 2,
                    items: {
                        type: "object",
                        anyOf: [
                            {
                                required: ["title"],
                                properties: {
                                    title: { type: "string", default: "title" }
                                }
                            },
                            {
                                required: ["properties"],
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

                const res = getTemplate(draft, [{ title: "given-title" }]);
                expect(res).to.deep.equal([{ title: "given-title" }, { title: "title" }]);
            });
        });
    });

    describe("oneOf", () => {
        it("should return first schema for mixed types", () => {
            draft.setSchema({
                oneOf: [{ type: "string", default: "jane" }, { type: "number" }]
            });
            const res = getTemplate(draft);

            expect(res).to.deep.equal("jane");
        });
    });

    describe("list of types", () => {
        it("should return first type of list for template", () => {
            draft.setSchema({
                type: ["string", "object"]
            });
            const res = getTemplate(draft);

            expect(res).to.deep.equal("");
        });

        it("should return input data", () => {
            draft.setSchema({
                type: ["string", "object"]
            });
            const res = getTemplate(draft, "title");

            expect(res).to.deep.equal("title");
        });

        it("should return type of default value if data is not given", () => {
            draft.setSchema({
                type: ["string", "array", "object"],
                default: []
            });
            const res = getTemplate(draft);

            expect(res).to.deep.equal([]);
        });
    });

    describe("templateOptions", () => {
        it("should remove invalid oneOf schema if 'removeInvalidData=true'", () => {
            draft.setSchema({
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
            const res = getTemplate(draft, { value: ["keep-me"] }, draft.getSchema(), {
                removeInvalidData: true
            });

            expect(res).to.deep.equal({});
        });

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
            draft.setSchema(schema);

            const template = getTemplate(draft, {}, schema, {
                addOptionalProps: false
            });

            expect({ list: [], author: "jane" }).to.deep.equal(template);
        });


        describe("extendDefaults", () => {

            it("should keep array default-value with 'extendDefaults:false'", () => {
                draft.setSchema({
                    type: "array",
                    default: [],
                    items: {
                        type: "string",
                        enum: ["one", "two"]
                    },
                    minItems: 1 // usually adds an enty, but default states: []
                });
                const res = getTemplate(draft, undefined, draft.getSchema(), {
                    extendDefaults: false
                });

                expect(res).to.deep.equal([]);
            });

            it("should add items to array with no default-value given and 'extendDefaults:false'", () => {
                draft.setSchema({
                    type: "array",
                    items: {
                        type: "string",
                        enum: ["one", "two"]
                    },
                    minItems: 1 // usually adds an enty, but default states: []
                });
                const res = getTemplate(draft, undefined, draft.getSchema(), {
                    extendDefaults: false
                });

                expect(res).to.deep.equal(["one"]);
            });

            it("should not add required items to object with default-value given and 'extendDefaults:false'", () => {
                draft.setSchema({
                    type: "object",
                    required: ["title"],
                    default: {},
                    properties: {
                        title: { type: "string" }
                    }
                });
                const res = getTemplate(draft, undefined, draft.getSchema(), {
                    extendDefaults: false
                });

                expect(res).to.deep.equal({});
            });

            it("should extend object by required property with no default-value given and 'extendDefaults:false'", () => {
                draft.setSchema({
                    type: "object",
                    required: ["title"],
                    properties: {
                        title: { type: "string" }
                    }
                });
                const res = getTemplate(draft, undefined, draft.getSchema(), {
                    extendDefaults: false
                });

                expect(res).to.deep.equal({ title: "" });
            });
        });

    });
});
