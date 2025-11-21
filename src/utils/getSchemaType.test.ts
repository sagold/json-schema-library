import { compileSchema } from "../compileSchema";
import { getSchemaType } from "./getSchemaType";
import { strict as assert } from "assert";

describe("getSchemaType", () => {
    it("should get correct type for simple ref", () => {
        const schema = compileSchema({
            type: "object",
            $defs: {
                customConst: {
                    type: "string"
                }
            },
            properties: {
                name: { $ref: "#/$defs/customConst" }
            }
        });
        const nameProp = schema.getNodeChild("name").node;
        assert(nameProp != null);

        assert.equal(getSchemaType(nameProp, undefined), "string");
    });

    it("should handle oneOf refs", () => {
        const schema = compileSchema({
            type: "object",
            $defs: {
                a: {
                    type: "string",
                    const: "a"
                },
                b: {
                    type: "string",
                    const: "b"
                }
            },

            properties: {
                oneOf: {
                    oneOf: [{ $ref: "#/$defs/a" }, { $ref: "#/$defs/b" }]
                }
            }
        });
        const oneOfProp = schema.getNodeChild("oneOf").node;
        assert(oneOfProp != null);

        assert.equal(getSchemaType(oneOfProp, undefined), "string");
    });
    it("should handle anyOf refs", () => {
        const schema = compileSchema({
            type: "object",
            $defs: {
                a: { type: "string", const: "a" },
                b: { type: "string", const: "b" }
            },
            properties: {
                anyOf: {
                    anyOf: [{ $ref: "#/$defs/a" }, { $ref: "#/$defs/b" }]
                }
            }
        });
        const anyOfProp = schema.getNodeChild("anyOf").node;
        assert(anyOfProp != null);

        assert.equal(getSchemaType(anyOfProp, undefined), "string");
    });

    it("should handle allOf refs", () => {
        const schema = compileSchema({
            type: "object",
            $defs: {
                a: { type: "object", properties: { a: { type: "string" } } },
                b: { type: "object", properties: { b: { type: "string" } } }
            },
            properties: {
                allOf: {
                    allOf: [{ $ref: "#/$defs/a" }, { $ref: "#/$defs/b" }]
                }
            }
        });
        const allOfProp = schema.getNodeChild("allOf").node;
        assert(allOfProp != null);

        assert.equal(getSchemaType(allOfProp, undefined), "object");
    });

    it("should handle if/then/else refs", () => {
        const schema = compileSchema({
            type: "object",
            $defs: {
                stringSchema: {
                    type: "string"
                }
            },
            properties: {
                conditional: {
                    if: { $ref: "#/$defs/stringSchema" },
                    then: { minLength: 5 },
                    else: { maxLength: 2 }
                }
            }
        });
        const conditionalProp = schema.getNodeChild("conditional").node;
        assert(conditionalProp != null);

        assert.equal(getSchemaType(conditionalProp, undefined), "string");
    });
});
