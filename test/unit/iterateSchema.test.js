/* eslint quote-props: 0, no-unused-expressions: 0 */
const expect = require("chai").expect;
const iterateSchema = require("../../lib/iterateSchema");


describe("iterateSchema", () => {

    it("should execute callback on root-schema", () => {
        let firstCall;
        const rootSchema = {
            type: "object",
            properties: {}
        };

        iterateSchema(rootSchema, (schema) => (firstCall = firstCall || schema));

        expect(firstCall).to.eq(rootSchema);
    });

    it("should call on each property schema", () => {
        const calls = [];
        const rootSchema = {
            type: "object",
            properties: {
                first: { type: "string" },
                second: { type: "number" }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.properties.first);
        expect(calls[2]).to.eq(rootSchema.properties.second);
    });

    it("should call on each item schema", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.items[0]);
        expect(calls[2]).to.eq(rootSchema.items[1]);
    });

    it("should call on each item property", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    first: { type: "string" },
                    second: { type: "number" }
                }
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(4);
        expect(calls[2]).to.eq(rootSchema.items.properties.first);
        expect(calls[3]).to.eq(rootSchema.items.properties.second);
    });

    it("should call on each oneOf-schema", () => {
        const calls = [];
        const rootSchema = {
            oneOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.oneOf[0]);
        expect(calls[2]).to.eq(rootSchema.oneOf[1]);
    });

    it("should call on each oneOf-schema in items", () => {
        const calls = [];
        const rootSchema = {
            type: "array",
            items: {
                oneOf: [
                    { type: "string" },
                    { type: "number" }
                ]
            }
        };

        iterateSchema(rootSchema, (schema) => calls.push(schema));

        expect(calls).to.have.length(3);
        expect(calls[1]).to.eq(rootSchema.items.oneOf[0]);
        expect(calls[2]).to.eq(rootSchema.items.oneOf[1]);
    });
});
