import { Draft07 as Draft } from "../../lib/draft07";
import { expect } from "chai";
import { JsonSchema } from "../../lib/types";
import { resolveDynamicSchema as resolve } from "../../lib/resolveDynamicSchema";
import { createNode, isSchemaNode } from "../../lib/schemaNode";

function resolveDynamicSchema(draft: Draft, schema: JsonSchema, data: unknown, pointer = "#") {
    const r = resolve(createNode(draft, schema, pointer), data);
    if (r && isSchemaNode(r)) {
        return r.schema;
    }
    return r;
}

describe("resolveDynamicSchema", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft()));

    describe("dependencies", () => {
        it("should correctly merge dependencies", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" },
                            two: { type: "string" }
                        },
                        dependencies: {
                            one: ["two"],
                            two: {
                                $ref: "/$defs/two"
                            }
                        }
                    },
                    two: {
                        required: ["three"],
                        properties: {
                            three: {
                                type: "number"
                            }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(
                draft,
                { $ref: "#/$defs/schema" },
                { one: "" },
                "#"
            );
            expect(schema).to.deep.equal({
                required: ["two", "three"],
                properties: {
                    three: { type: "number" }
                }
            });
        });
        it("should return undefined if dynamic schema is not triggered", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: [],
                        properties: {
                            one: { type: "string" },
                            two: { type: "string" }
                        },
                        dependencies: {
                            one: ["two"]
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(draft, { $ref: "#/$defs/schema" }, {}, "#");
            expect(schema).to.deep.equal(undefined);
        });
        it("should resolve nested dependencies schema", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" },
                            two: { type: "string" }
                        },
                        dependencies: {
                            one: ["two"],
                            two: { $ref: "/$defs/two" }
                        }
                    },
                    two: {
                        required: ["three"],
                        properties: {
                            three: { type: "number" }
                        },
                        dependencies: {
                            two: {
                                properties: {
                                    four: { type: "boolean" }
                                }
                            }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(
                draft,
                { $ref: "#/$defs/schema" },
                { one: "" },
                "#"
            );
            expect(schema).to.deep.equal({
                required: ["two", "three"],
                properties: {
                    three: { type: "number" },
                    four: { type: "boolean" }
                }
            });
        });
    });

    describe("if-then-else", () => {
        it("should select if-then-else schema", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" }
                        },
                        if: {
                            minProperties: 1
                        },
                        then: {
                            $ref: "/$defs/then"
                        }
                    },
                    then: {
                        required: ["two"],
                        properties: {
                            two: { type: "string" }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(
                draft,
                { $ref: "#/$defs/schema" },
                { one: "" },
                "#"
            );
            expect(schema).to.deep.equal({
                required: ["two"],
                properties: {
                    two: { type: "string" }
                }
            });
        });

        it("should return undefined if dynamic schema is not triggered", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" }
                        },
                        if: {
                            minProperties: 1
                        },
                        then: {
                            required: ["two"],
                            properties: {
                                two: { type: "string" }
                            }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(draft, { $ref: "#/$defs/schema" }, {}, "#");
            expect(schema).to.deep.equal(undefined);
        });

        it("should resolve nested if-then-else schema", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" }
                        },
                        if: {
                            minProperties: 1
                        },
                        then: {
                            $ref: "/$defs/then"
                        }
                    },
                    then: {
                        if: {
                            minProperties: 1
                        },
                        then: {
                            required: ["two"],
                            properties: {
                                two: { type: "string" }
                            }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(
                draft,
                { $ref: "#/$defs/schema" },
                { one: "" },
                "#"
            );
            expect(schema).to.deep.equal({
                required: ["two"],
                properties: {
                    two: { type: "string" }
                }
            });
        });
    });

    describe("allOf", () => {
        it("should return merged allOf schema", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" }
                        },
                        allOf: [
                            {
                                $ref: "/$defs/one"
                            },
                            {
                                $ref: "/$defs/two"
                            }
                        ]
                    },
                    one: {
                        required: ["one"]
                    },
                    two: {
                        required: ["two"],
                        properties: {
                            two: { type: "number" }
                        }
                    }
                }
            });
            const schema = resolveDynamicSchema(draft, { $ref: "/$defs/schema" }, {}, "#");
            expect(schema).to.deep.equal({
                required: ["one", "two"],
                properties: {
                    two: { type: "number" }
                }
            });
        });

        it("should return undefined if allOf is empty", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    required: ["one"],
                    properties: {
                        one: { type: "string" }
                    },
                    allOf: []
                },
                {},
                "#"
            );
            expect(schema).to.deep.equal(undefined);
        });

        it("should resolve nested allOf schema", () => {
            draft.setSchema({
                $defs: {
                    schema: {
                        type: "object",
                        required: ["one"],
                        properties: {
                            one: { type: "string" }
                        },
                        allOf: [
                            {
                                $ref: "/$defs/one"
                            },
                            {
                                $ref: "/$defs/two"
                            }
                        ]
                    },
                    one: {
                        required: ["one"]
                    },
                    two: {
                        required: ["two"],
                        allOf: [
                            {
                                properties: {
                                    two: { type: "number" }
                                }
                            }
                        ]
                    }
                }
            });
            const schema = resolveDynamicSchema(draft, { $ref: "/$defs/schema" }, {}, "#");
            expect(schema).to.deep.equal({
                required: ["one", "two"],
                properties: {
                    two: { type: "number" }
                }
            });
        });
    });

    describe("oneOf", () => {
        it("should select oneOf schema", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    oneOf: [
                        {
                            properties: {
                                one: {
                                    type: "number"
                                }
                            }
                        },
                        {
                            properties: {
                                two: {
                                    type: "string"
                                }
                            }
                        }
                    ]
                },
                { one: "string" },
                "#"
            );
            expect(schema).to.deep.equal({
                properties: {
                    two: {
                        type: "string"
                    }
                }
            });
        });
        it("should select correct oneOf schema from oneOfProperty", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    oneOfProperty: "id",
                    oneOf: [
                        {
                            properties: {
                                id: { const: "first" },
                                one: { type: "number" }
                            }
                        },
                        {
                            properties: {
                                id: { const: "second" },
                                one: { type: "number" }
                            }
                        }
                    ]
                },
                { id: "second" },
                "#"
            );

            expect(schema).to.deep.equal({
                properties: {
                    id: { const: "second" },
                    one: { type: "number" }
                }
            });
        });
    });

    describe("anyOf", () => {
        it("should return undefined if anyOf is empty", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object"
                },
                { id: "second" },
                "#"
            );

            expect(schema).to.equal(undefined);
        });

        it("should return undefined if no anyOf matches input data", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    anyOf: [
                        {
                            properties: {
                                id: { const: "first" }
                            }
                        }
                    ]
                },
                { id: "second" },
                "#"
            );

            expect(schema).to.equal(undefined);
        });

        it("should return matching oneOf schema", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    anyOf: [
                        {
                            properties: {
                                id: { const: "second" }
                            }
                        }
                    ]
                },
                { id: "second" },
                "#"
            );

            expect(schema).to.deep.equal({
                properties: {
                    id: { const: "second" }
                }
            });
        });

        it("should return all matching oneOf schema as merged schema", () => {
            const schema = resolveDynamicSchema(
                draft,
                {
                    type: "object",
                    anyOf: [
                        {
                            properties: {
                                id: { const: "second" }
                            }
                        },
                        {
                            properties: {
                                id: { minLength: 4 }
                            }
                        },
                        {
                            properties: {
                                id: { maxLength: 4 }
                            }
                        }
                    ]
                },
                { id: "second" },
                "#"
            );

            expect(schema).to.deep.equal({
                properties: {
                    id: { const: "second", minLength: 4 }
                }
            });
        });
    });
});
