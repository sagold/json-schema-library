import { expect } from "chai";
import getSchema from "../../lib/getSchema";
import Core from "../../lib/cores/Draft04";
describe("getSchema", () => {
    let core;
    before(() => (core = new Core()));
    describe("value", () => {
        it("should return schema of any value", () => {
            core.setSchema({ name: "target", type: "*" });
            const schema = getSchema(core, "#");
            expect(schema).to.deep.include({ name: "target", type: "*" });
        });
    });
    describe("object", () => {
        it("should return schema of the given property", () => {
            core.setSchema({
                type: "object",
                properties: {
                    title: { name: "title", type: "string" }
                }
            });
            const schema = getSchema(core, "#/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });
        it("should return schema for property within nested object", () => {
            core.setSchema({
                type: "object",
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { name: "title", type: "string" }
                        }
                    }
                }
            });
            const schema = getSchema(core, "#/image/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });
        it("should resolve $ref as property", () => {
            core.setSchema({
                type: "object",
                definitions: {
                    target: {
                        name: "target"
                    }
                },
                properties: {
                    image: {
                        $ref: "#/definitions/target"
                    }
                }
            });
            const schema = getSchema(core, "#/image");
            expect(schema).to.deep.include({ name: "target" });
        });
        it("should return correct 'oneOf' object definition", () => {
            core.setSchema({
                type: "object",
                oneOf: [
                    {
                        type: "object",
                        properties: { first: { type: "string" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { second: { type: "string", name: "target" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { third: { type: "string" } },
                        additionalProperties: false
                    }
                ]
            });
            const schema = getSchema(core, "#/second", { second: "string" });
            expect(schema).to.deep.include({ name: "target", type: "string" });
        });
        it("should return schema of matching patternProperty", () => {
            core.setSchema({
                type: "object",
                patternProperties: {
                    "^abc$": { type: "string" },
                    "^def$": { type: "number" }
                }
            });
            const schema = getSchema(core, "#/def");
            expect(schema).to.deep.include({ type: "number" });
        });
        it("should return an error if schema could not be resolved", () => {
            core.setSchema({
                type: "object",
                properties: { coffee: { type: "string" } },
                patternProperties: { "^tee$": { type: "string" } },
                additionalProperties: false
            });
            const schema = getSchema(core, "#/beer");
            expect(schema.name).to.equal("UnknownPropertyError");
        });
    });
    describe("array", () => {
        it("should return item schema", () => {
            core.setSchema({
                type: "array",
                items: { name: "title", type: "string" }
            });
            const schema = getSchema(core, "#/0");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });
        it("should return item schema based on index", () => {
            core.setSchema({
                type: "array",
                items: [
                    { type: "number" },
                    { name: "target", type: "string" },
                    { type: "number" }
                ]
            });
            const schema = getSchema(core, "#/1");
            expect(schema).to.deep.include({ name: "target", type: "string" });
        });
        it("should return schema for matching 'oneOf' item", () => {
            core.setSchema({
                type: "array",
                items: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { first: { type: "string" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { second: { type: "string", name: "target" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { third: { type: "string" } },
                            additionalProperties: false
                        }
                    ]
                }
            });
            const schema = getSchema(core, "#/0/second", [{ second: "second" }]);
            expect(schema).to.deep.include({ type: "string", name: "target" });
        });
    });
});
