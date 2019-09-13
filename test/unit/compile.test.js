const { expect } = require("chai");
const compile = require("../../lib/compile");
const remotes = require("../../remotes");


describe.only("compile", () => {
    describe("behaviour", () => {

        it("should return a copy", () => {
            const schema = {};
            const result = compile(schema);

            expect(result).not.to.eq(schema);
        });

        it("should not copy schema twice", () => {
            const schema = compile({});
            const result = compile(schema);

            expect(result).to.eq(schema);
        });

        it("should not change iterable properties", () => {
            const result = compile(require("../../remotes/draft04.json"));

            expect(result).to.deep.eq(require("../../remotes/draft04.json"));
        });
    });


    describe("getRef", () => {

        // default behaviour

        it("should always return json-pointer target", () => {
            const schema = compile({
                type: "object",
                defs: {
                    key: { type: "any" }
                }
            });

            const result = schema.getRef("#/defs/key");

            expect(result).to.deep.eq({ type: "any" });
        });

        it("should return a defined $ref with json-pointer", () => {
            const schema = compile({
                type: "object", properties: {
                    ref: { $ref: "#/defs/key" }
                },
                defs: {
                    key: { type: "any" }
                }
            });

            const result = schema.getRef("#/defs/key");

            expect(result).to.deep.eq({ type: "any" });
        });

        // scope ids

        it("should return schema defined with referenced ids", () => {
            // optimized version, requiring a $ref target within schema
            const schema = compile({
                type: "object", properties: {
                    ref: { $ref: "#/any/target" }
                },
                definitions: {
                    target: { id: "#target", type: "any" }
                }
            });

            const result = schema.getRef("#target");

            expect(result).to.deep.eq({ id: "#target", type: "any" });
        });

        it("should return schema for absolute assembled scope ids", () => {
            // optimized version, requiring a $ref target within schema
            const schema = compile({
                id: "http://localhost.com/#",
                type: "object", properties: {
                    ref: { $ref: "http://localhost.com/folder#target" }
                },
                definitions: {
                    intermediate: {
                        id: "folder",
                        type: "object", properties: {
                            target: {
                                id: "#target",
                                type: "array"
                            }
                        }
                    }
                }
            });

            const result = schema.getRef("http://localhost.com/folder#target");

            expect(result).to.deep.eq({ id: "#target", type: "array" });
        });
    });


    describe("getRef remote", () => {

        it("should resolve remotes", () => {
            remotes["http://remotehost.com/schema"] = compile({ type: "integer" });
            const schema = compile({ $ref: "http://remotehost.com/schema" });

            const result = schema.getRef("http://remotehost.com/schema");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve remotes with trailing '#'", () => {
            remotes["http://remotehost.com/schema"] = compile({ type: "integer" });
            const schema = compile({ $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#");

            expect(result).to.deep.eq({ type: "integer" });
        });
    });


    describe("spec ref.json", () => {});
    describe("spec remoteRef.json", () => {});
});
