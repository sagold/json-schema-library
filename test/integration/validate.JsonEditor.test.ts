import path from "path";
import fs from "fs";
import { expect } from "chai";
import { strict as assert } from "assert";
import { JsonEditor as Core } from "../../lib/jsoneditor";
import { JsonSchema, isJsonError } from "../../lib/types";
import { isSchemaNode } from "../../lib/schemaNode";

describe("validate.JsonEditor", () => {
    let schema: JsonSchema;
    let data: unknown;
    let draft: Core;

    beforeEach(() => {
        schema = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-schema.json"), "utf8")
        );
        data = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-data.json"), "utf8")
        );
        draft = new Core(schema);
    });

    it("should validate test-data by default", () => {
        const errors = draft.validate(draft.createNode(schema), data);

        expect(errors).to.have.length(0);
    });

    describe("resolveRef", () => {
        it("should merge any properties where $ref is used", () => {
            draft.rootSchema = { definitions: { def: { type: "string" } } };
            const node = draft.resolveRef(
                draft.createNode({ $ref: "#/definitions/def", title: "a definition" })
            );

            assert(isSchemaNode(node));
            const result = node.schema;
            expect(result).to.deep.include({ type: "string", title: "a definition" });
        });
    });

    describe("oneOf", () => {
        it("should return a matching schema", () => {
            const node = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [{ type: "string" }, { type: "number" }]
                }),
                5
            );

            assert(isSchemaNode(node));
            const result = node.schema;
            expect(result).to.deep.equal({ __oneOfIndex: 1, type: "number" });
        });

        it("should return an error if a matching schema could not be found", () => {
            const result = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [{ type: "string" }, { type: "number" }]
                }),
                []
            );

            assert(isJsonError(result));
            expect(result.type).to.eq("error");
            expect(result.name).to.eq("OneOfError");
        });

        it("should return an error if multiple schemas match the data", () => {
            const result = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [
                        { type: "string" },
                        { type: "number", minimum: 2 },
                        { type: "number", minimum: 3 }
                    ]
                }),
                4
            );

            assert(isJsonError(result));
            expect(result.type).to.eq("error");
            expect(result.name).to.eq("MultipleOneOfError");
        });

        describe("oneOfProperty", () => {
            it("should return schema where 'oneOfProperty'-value matches schema", () => {
                const node = draft.resolveOneOf(
                    draft.createNode({
                        oneOfProperty: "id",
                        oneOf: [
                            { properties: { id: { pattern: "^1$" } } },
                            { properties: { id: { pattern: "^2$" } } },
                            { properties: { id: { pattern: "^3$" } } }
                        ]
                    }),
                    { id: "2" }
                );

                assert(isSchemaNode(node));
                const result = node.schema;
                expect(result).to.deep.equal({
                    __oneOfIndex: 1,
                    properties: { id: { pattern: "^2$" } }
                });
            });
        });

        describe("fuzzyMatch", () => {
            it("should return schema where most properties match", () => {
                const node = draft.resolveOneOf(
                    draft.createNode({
                        oneOf: [
                            { properties: { id: { pattern: "^1$" }, a: { type: "object" } } },
                            {
                                properties: {
                                    id: { pattern: "^2$" },
                                    a: { type: "string" },
                                    b: { type: "number" }
                                }
                            },
                            { properties: { id: { pattern: "^3$" }, a: { type: "number" } } }
                        ]
                    }),
                    { id: "4", a: 1, b: 2 }
                );

                assert(isSchemaNode(node));
                const result = node.schema;
                expect(result).to.deep.equal({
                    __oneOfIndex: 1,
                    properties: {
                        id: { pattern: "^2$" },
                        a: { type: "string" },
                        b: { type: "number" }
                    }
                });
            });
        });
    });
});
