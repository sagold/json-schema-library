const expect = require("chai").expect;
const getSchema = require("../../lib/getSchema");


describe("getSchema", () => {

    describe("value", () => {

        it("should return schema of any value", () => {
            const schema = getSchema({ id: "target", type: "*" }, "#");
            expect(schema).to.deep.equal({ id: "target", type: "*" });
        });
    });

    describe("object", () => {

        it("should return schema of the given property", () => {
            const schema = getSchema({
                type: "object",
                properties: {
                    title: { id: "title", type: "string" }
                }
            }, "#/title");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should return schema for property within nested object", () => {
            const schema = getSchema({
                type: "object",
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { id: "title", type: "string" }
                        }
                    }
                }
            }, "#/image/title");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should resolve $ref as property", () => {
            const schema = getSchema({
                type: "object",
                definitions: {
                    target: {
                        id: "target"
                    }
                },
                properties: {
                    image: {
                        $ref: "#/definitions/target"
                    }
                }
            }, "#/image");
            expect(schema).to.deep.equal({ id: "target" });
        });

        it("should return correct 'oneOf' object definition", () => {
            const schema = getSchema({
                type: "object",
                oneOf: [
                    {
                        type: "object",
                        properties: { first: { type: "string" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { second: { type: "string", id: "target" } },
                        additionalProperties: false
                    },
                    {
                        type: "object",
                        properties: { third: { type: "string" } },
                        additionalProperties: false
                    }
                ]
            }, "#/second", { second: "string" });
            expect(schema).to.deep.equal({ id: "target", type: "string" });
        });
    });

    describe("array", () => {

        it("should return item schema", () => {
            const schema = getSchema({
                type: "array",
                items: { id: "title", type: "string" }
            }, "#/0");
            expect(schema).to.deep.equal({ id: "title", type: "string" });
        });

        it("should return item schema based on index", () => {
            const schema = getSchema({
                type: "array",
                items: [
                    { type: "number" },
                    { id: "target", type: "string" },
                    { type: "number" }
                ]
            }, "#/1");
            expect(schema).to.deep.equal({ id: "target", type: "string" });
        });

        it("should return schema for matching 'oneOf' item", () => {
            const schema = getSchema({
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
                            properties: { second: { type: "string", id: "target" } },
                            additionalProperties: false
                        },
                        {
                            type: "object",
                            properties: { third: { type: "string" } },
                            additionalProperties: false
                        }
                    ]
                }
            }, "#/0/second", [{ second: "second" }]);
            expect(schema).to.deep.equal({ type: "string", id: "target" });
        });
    });
});
