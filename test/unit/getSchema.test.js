const expect = require("chai").expect;
const getSchema = require("../../lib/getSchema");
const Core = require("../../lib/cores/Draft04");


describe("getSchema", () => {

    let core;
    before(() => (core = new Core()));


    describe("value", () => {

        it("should return schema of any value", () => {
            core.rootSchema = { name: "target", type: "*" };
            const schema = getSchema(core, core.rootSchema, undefined, "#");
            expect(schema).to.deep.include({ name: "target", type: "*" });
        });
    });


    describe("object", () => {

        it("should return schema of the given property", () => {
            core.rootSchema = {
                type: "object",
                properties: {
                    title: { name: "title", type: "string" }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should return schema for property within nested object", () => {
            core.rootSchema = {
                type: "object",
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { name: "title", type: "string" }
                        }
                    }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/image/title");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should resolve $ref as property", () => {
            core.rootSchema = {
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
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/image");
            expect(schema).to.deep.include({ name: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            core.rootSchema = {
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
            };
            const schema = getSchema(core, core.rootSchema, { second: "string" }, "#/second");
            expect(schema).to.deep.include({ name: "target", type: "string" });
        });

        it("should return schema of matching patternProperty", () => {
            core.rootSchema = {
                type: "object",
                patternProperties: {
                    "^abc$": { type: "string" },
                    "^def$": { type: "number" }
                }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/def");
            expect(schema).to.deep.include({ type: "number" });
        });

        it("should return an error if schema could not be resolved", () => {
            core.rootSchema = {
                type: "object",
                properties: { coffee: { type: "string" } },
                patternProperties: { "^tee$": { type: "string" } },
                additionalProperties: false
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/beer");
            expect(schema.name).to.equal("UnknownPropertyError");
        });
    });


    describe("array", () => {

        it("should return item schema", () => {
            core.rootSchema = {
                type: "array",
                items: { name: "title", type: "string" }
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/0");
            expect(schema).to.deep.include({ name: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            core.rootSchema = {
                type: "array",
                items: [
                    { type: "number" },
                    { name: "target", type: "string" },
                    { type: "number" }
                ]
            };
            const schema = getSchema(core, core.rootSchema, undefined, "#/1");
            expect(schema).to.deep.include({ name: "target", type: "string" });
        });

        it("should return schema for matching 'oneOf' item", () => {
            core.rootSchema = {
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
            };
            const schema = getSchema(core, core.rootSchema, [{ second: "second" }], "#/0/second");
            expect(schema).to.deep.include({ type: "string", name: "target" });
        });
    });
});
