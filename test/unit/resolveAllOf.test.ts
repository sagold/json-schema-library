/* eslint quote-props: 0 max-len: 0 */
import { expect } from "chai";
import resolveAllOf from "../../lib/resolveAllOf";
import { Draft07 } from "../../lib/draft07";

describe("resolveAllOf", () => {
    let draft: Draft07;
    beforeEach(() => (draft = new Draft07()));

    it("should return merged schema of type string", () => {
        const schema = resolveAllOf(draft, "a-value", {
            type: "string",
            allOf: [{ minLength: 10 }, { pattern: /a-.*/ }]
        });
        expect(schema).to.deep.equal({
            type: "string",
            minLength: 10,
            pattern: /a-.*/
        });
    });

    it("should return merged schema while resolving $ref", () => {
        draft.setSchema({
            type: "string",
            allOf: [{ $ref: "/$defs/min" }, { $ref: "/$defs/pattern" }],
            $defs: {
                min: { minLength: 10 },
                pattern: { format: "html" }
            }
        });

        const schema = resolveAllOf(draft, "a-value", draft.getSchema());

        // root schema details
        delete schema.$defs;
        expect(schema).to.deep.equal({
            type: "string",
            minLength: 10,
            format: "html"
        });
    });

    it("should return merged properties and attributes", () => {
        const schema = resolveAllOf(draft, "a-value", {
            type: "object",
            properties: {
                trigger: { type: "boolean" }
            },
            allOf: [
                {
                    properties: {
                        title: { type: "string" }
                    }
                },
                {
                    minProperties: 2,
                    properties: {
                        time: { type: "number" }
                    }
                }
            ]
        });
        expect(schema).to.deep.equal({
            type: "object",
            minProperties: 2,
            properties: {
                trigger: { type: "boolean" },
                title: { type: "string" },
                time: { type: "number" }
            }
        });
    });

    it("should return merged required-list of type object", () => {
        const schema = resolveAllOf(draft, "a-value", {
            type: "object",
            required: ["trigger"],
            properties: {
                trigger: { type: "boolean" }
            },
            allOf: [
                {
                    required: ["title"],
                    properties: {
                        title: { type: "string" }
                    }
                },
                {
                    required: [],
                    properties: {
                        time: { type: "number" }
                    }
                }
            ]
        });
        expect(schema).to.deep.equal({
            type: "object",
            required: ["trigger", "title"],
            properties: {
                trigger: { type: "boolean" },
                title: { type: "string" },
                time: { type: "number" }
            }
        });
    });

    it("should return unique merged required-list of type object", () => {
        const schema = resolveAllOf(draft, "a-value", {
            type: "object",
            required: ["trigger"],
            properties: {
                trigger: { type: "boolean" }
            },
            allOf: [
                {
                    required: ["trigger", "title"],
                    properties: {
                        title: { type: "string" }
                    }
                }
            ]
        });
        expect(schema).to.deep.equal({
            type: "object",
            required: ["trigger", "title"],
            properties: {
                trigger: { type: "boolean" },
                title: { type: "string" }
            }
        });
    });

    describe("if-then-else", () => {
        it("should not return 'then'-schema when 'if' does not match", () => {
            const schema = resolveAllOf(
                draft,
                { trigger: false },
                {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    additionalSchema: { type: "string", default: "additional" }
                                }
                            }
                        }
                    ]
                }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" }
                }
            });
        });
        it("should return 'then'-schema when 'if' does match", () => {
            const schema = resolveAllOf(
                draft,
                { trigger: true },
                {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    additionalSchema: { type: "string", default: "additional" }
                                }
                            }
                        }
                    ]
                }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" },
                    additionalSchema: { type: "string", default: "additional" }
                }
            });
        });
        it("should merge multiple 'then'-schema", () => {
            const schema = resolveAllOf(
                draft,
                { trigger: true },
                {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    additionalSchema: { type: "string", default: "additional" }
                                }
                            }
                        },
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    anotherSchema: { type: "string", default: "another" }
                                }
                            }
                        }
                    ]
                }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" },
                    additionalSchema: { type: "string", default: "additional" },
                    anotherSchema: { type: "string", default: "another" }
                }
            });
        });

        it("should merge only matching 'if'-schema", () => {
            const schema = resolveAllOf(
                draft,
                { trigger: true },
                {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    additionalSchema: { type: "string", default: "additional" }
                                }
                            }
                        },
                        {
                            if: {
                                required: ["additionalSchema"],
                                properties: {
                                    additionalSchema: { type: "string", minLength: 50 }
                                }
                            },
                            then: {
                                properties: {
                                    anotherSchema: { type: "string", default: "another" }
                                }
                            }
                        }
                    ]
                }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" },
                    additionalSchema: { type: "string", default: "additional" }
                }
            });
        });

        it("should incrementally resolve multiple 'then'-schema", () => {
            const schema = resolveAllOf(
                draft,
                { trigger: true },
                {
                    type: "object",
                    required: ["trigger"],
                    properties: {
                        trigger: { type: "boolean" }
                    },
                    allOf: [
                        {
                            if: {
                                properties: {
                                    trigger: { const: true }
                                }
                            },
                            then: {
                                properties: {
                                    additionalSchema: { type: "string", default: "additional" }
                                }
                            }
                        },
                        {
                            if: {
                                required: ["additionalSchema"],
                                properties: {
                                    additionalSchema: { minLength: 5 }
                                }
                            },
                            then: {
                                properties: {
                                    anotherSchema: { type: "string", default: "another" }
                                }
                            }
                        }
                    ]
                }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["trigger"],
                properties: {
                    trigger: { type: "boolean" },
                    additionalSchema: { type: "string", default: "additional" },
                    anotherSchema: { type: "string", default: "another" }
                }
            });
        });
    });
});
