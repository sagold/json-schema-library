/* eslint quote-props: 0, no-unused-expressions: 0 */
import { expect } from "chai";
import eachSchema from "../../lib/eachSchema";


describe("eachSchema", () => {

    it("should execute callback on root-schema", () => {
        let firstCall;
        const rootSchema = {
            type: "object",
            properties: {}
        };

        eachSchema(rootSchema, schema => (firstCall = firstCall || schema));

        expect(firstCall).to.eq(rootSchema);
    });


    // maybe not. This would remove simple pointer config
    it.skip("should call on unspecified properties", () => {
        const calls = [];
        const rootSchema = {
            type: "object",
            properties: {
                title: {}
            }
        };

        eachSchema(rootSchema, (schema, pointer) => calls.push(pointer));

        expect(calls).to.have.length(2);
        expect(calls[1]).to.eq("/properties/title");
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

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(3);
        expect(calls[1].schema).to.eq(rootSchema.properties.first);
        expect(calls[1].pointer).to.eq("/properties/first");
        expect(calls[2].schema).to.eq(rootSchema.properties.second);
        expect(calls[2].pointer).to.eq("/properties/second");
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

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(3);
        expect(calls[1].schema).to.eq(rootSchema.items[0]);
        expect(calls[1].pointer).to.eq("/items/0");
        expect(calls[2].schema).to.eq(rootSchema.items[1]);
        expect(calls[2].pointer).to.eq("/items/1");
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

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(4);
        expect(calls[2].schema).to.eq(rootSchema.items.properties.first);
        expect(calls[2].pointer).to.eq("/items/properties/first");
        expect(calls[3].schema).to.eq(rootSchema.items.properties.second);
        expect(calls[3].pointer).to.eq("/items/properties/second");
    });


    it("should call on each oneOf-schema", () => {
        const calls = [];
        const rootSchema = {
            oneOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(3);
        expect(calls[1].schema).to.eq(rootSchema.oneOf[0]);
        expect(calls[1].pointer).to.eq("/oneOf/0");
        expect(calls[2].schema).to.eq(rootSchema.oneOf[1]);
        expect(calls[2].pointer).to.eq("/oneOf/1");
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

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(4);
        expect(calls[1].schema).to.eq(rootSchema.items);
        expect(calls[1].pointer).to.eq("/items");
        expect(calls[2].schema).to.eq(rootSchema.items.oneOf[0]);
        expect(calls[2].pointer).to.eq("/items/oneOf/0");
        expect(calls[3].schema).to.eq(rootSchema.items.oneOf[1]);
        expect(calls[3].pointer).to.eq("/items/oneOf/1");
    });


    it("should call on each anyOf-schema", () => {
        const calls = [];
        const rootSchema = {
            anyOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        eachSchema(rootSchema, (schema, pointer) => calls.push({ schema, pointer }));

        expect(calls.length).to.eq(3);
        expect(calls[1].schema).to.eq(rootSchema.anyOf[0]);
        expect(calls[1].pointer).to.eq("/anyOf/0");
        expect(calls[2].schema).to.eq(rootSchema.anyOf[1]);
        expect(calls[2].pointer).to.eq("/anyOf/1");
    });


    it("should call on each allOf-schema", () => {
        const calls = [];
        const rootSchema = {
            allOf: [
                { type: "string" },
                { type: "number" }
            ]
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(3);
        expect(calls[1]).to.eq(rootSchema.allOf[0]);
        expect(calls[2]).to.eq(rootSchema.allOf[1]);
    });


    it("should call on definitions", () => {
        const calls = [];
        const rootSchema = {
            definitions: {
                image: {
                    type: "string", format: "url"
                }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(2);
        expect(calls[1]).to.eq(rootSchema.definitions.image);
    });


    it("should call on additionalProperties", () => {
        const calls = [];
        const rootSchema = {
            type: "object",
            additionalProperties: {
                type: "object",
                properties: {
                    url: { type: "string" }
                }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(3);
        expect(calls[1]).to.eq(rootSchema.additionalProperties);
    });


    it("should ignore depedency list", () => {
        const calls = [];
        const rootSchema = {
            dependencies: {
                url: ["title"]
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(1);
    });


    it("should call on each depedency schema", () => {
        const calls = [];
        const rootSchema = {
            type: "object",
            dependencies: {
                url: ["title"],
                target: {
                    type: "string"
                }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(2);
        expect(calls[1]).to.eq(rootSchema.dependencies.target);
    });


    it("should iterate definitions", () => {
        const calls = [];
        const rootSchema = {
            definitions: {
                bar: { type: "array" }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(2);
        expect(calls[0]).to.eq(rootSchema);
        expect(calls[1]).to.eq(rootSchema.definitions.bar);
    });


    it("should iterate over nested definitions", () => {
        const calls = [];
        const rootSchema = {
            definitions: {
                bar: { type: "array" },
                nested: {
                    definitions: {
                        foo: { type: "string" }
                    }
                }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls).to.have.length(4);
        expect(calls[0]).to.eq(rootSchema);
        expect(calls[1]).to.eq(rootSchema.definitions.bar);
        expect(calls[2]).to.eq(rootSchema.definitions.nested);
        expect(calls[3]).to.eq(rootSchema.definitions.nested.definitions.foo);
    });

    it("should support array-types", () => {
        // https://json-schema.org/draft/2020-12/json-schema-core.html#rfc.section.7.6.1
        const calls = [];
        const rootSchema = {
            type: "object",
            properties: {
                simple: {
                    type: ["string", "number"]
                },
                primitive: {
                    type: ["string", "null"]
                }
            }
        };

        eachSchema(rootSchema, schema => calls.push(schema));

        expect(calls.length).to.eq(3);
        expect(calls[0]).to.eq(rootSchema);
        expect(calls[1]).to.eq(rootSchema.properties.simple);
        expect(calls[2]).to.eq(rootSchema.properties.primitive);
    });
});
