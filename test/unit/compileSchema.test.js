const { expect } = require("chai");
const compile = require("../../lib/compile");
const remotes = require("../../remotes");


describe("compile", () => {
    const FORCE_COMPILATION = true;
    afterEach(() => remotes.reset());

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
            const originalSchema = JSON.parse(JSON.stringify(require("../../remotes/draft04.json")));
            const result = compile(originalSchema);

            expect(result).to.deep.eq(originalSchema);
        });
    });


    describe("getRef", () => {

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
                    ref: { $ref: "#/any/ref" }
                },
                definitions: {
                    target: { id: "#target", type: "any" }
                }
            });

            const result = schema.getRef("#target");

            expect(result).to.deep.eq({ id: "#target", type: "any" });
        });

        it("should return schema for absolute assembled scope ids", () => {
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

        it("should resolve json-pointer with root-url", () => {
            // optimized version, requiring a $ref target within schema
            const schema = compile({
                id: "http://localhost.com/#",
                type: "object", properties: {
                    ref: { $ref: "any" }
                },
                definitions: {
                    target: {
                        type: "number"
                    }
                }
            });

            const result = schema.getRef("http://localhost.com/#/definitions/target");

            expect(result).to.deep.eq({ type: "number" });
        });
    });

    describe("compile ref", () => {

        it("should compile ref to absolute scope", () => {
            const schema = compile({
                id: "http://localhost:1234/tree",
                type: "object",
                properties: {
                    nodes: {
                        type: "array",
                        items: { $ref: "node" }
                    }
                }
            });

            expect(schema.properties.nodes.items.__ref).to.eq("http://localhost:1234/node");
        });

        it("should compile ref to absolute scope", () => {
            const schema = compile({
                definitions: {
                    node: {
                        id: "http://localhost:1234/node",
                        type: "object",
                        properties: {
                            subtree: { $ref: "tree" }
                        }
                    }
                }
            });

            expect(schema.definitions.node.properties.subtree.__ref).to.eq("http://localhost:1234/tree");
        });

        it("should resolve absolute url with subfolder", () => {
            const schema = compile({
                id: "http://localhost:1234/",
                items: {
                    id: "folder/",
                    items: { $ref: "folderInteger.json" }
                }
            });

            expect(schema.items.items.__ref).to.eq("http://localhost:1234/folder/folderInteger.json");
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

        it("should resolve pointer within remote", () => {
            remotes["http://remotehost.com/schema"] = compile({ definitions: { target: { type: "integer" } } });
            const schema = compile({ $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#/definitions/target");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve id within remote", () => {
            remotes["http://remotehost.com/schema"] = compile(
                {
                    definitions: { target: { id: "#r", type: "integer" } }
                },
                FORCE_COMPILATION
            );
            const schema = compile({ $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#r");

            expect(result).to.deep.eq({ id: "#r", type: "integer" });
        });
    });


    describe("spec ref.json", () => {

        it("should return root", () => {
            const schema = compile({ properties: { foo: { $ref: "#" } } });
            const result = schema.getRef("#");
            expect(result).to.deep.eq({ properties: { foo: { $ref: "#" } } });
        });

        it("should return relative pointer", () => {
            const schema = compile({ properties: { foo: { type: "integer" }, bar: { $ref: "#/properties/foo" } } });
            const result = schema.getRef("#/properties/foo");
            expect(result).to.deep.equal({ type: "integer" });
        });

        it("should work on escaped pointer", () => {
            const schema = compile({
                "tilda~field": { type: "integer" },
                "slash/field": { type: "integer" },
                "percent%field": { type: "integer" }
            });

            expect(schema.getRef("#/tilda~0field")).to.deep.equal({ type: "integer" });
            expect(schema.getRef("#/slash~1field")).to.deep.equal({ type: "integer" });
            expect(schema.getRef("#/percent%25field")).to.deep.equal({ type: "integer" });
        });

        it("should resolve nested $ref", () => {
            const schema = compile({
                definitions: {
                    a: { type: "integer" },
                    b: { $ref: "#/definitions/a" },
                    c: { $ref: "#/definitions/b" }
                },
                $ref: "#/definitions/c"
            });

            const result = schema.getRef("#/definitions/c");
            expect(result).to.deep.equal({ type: "integer" });
        });

        it("should resolve pointer containing quotes", () => {
            const schema = compile({ definitions: { "foo\"bar": { type: "number" } } });

            const result = schema.getRef("#/definitions/foo%22bar");
            expect(result).to.deep.equal({ type: "number" });
        });

        it("should resolve location independent identifier", () => {
            const schema = compile(
                { definitions: { A: { id: "#foo", type: "integer" } } },
                FORCE_COMPILATION
            );

            const result = schema.getRef("#foo");
            expect(result).to.deep.equal({ id: "#foo", type: "integer" });
        });

        it("should resolve location independent identifier with base uri change in subschema", () => {
            const schema = compile(
                {
                    id: "http://localhost:1234/root",
                    definitions: {
                        A: {
                            id: "nested.json",
                            definitions: {
                                B: { id: "#foo", type: "integer" }
                            }
                        }
                    }
                },
                FORCE_COMPILATION
            );

            const result = schema.getRef("http://localhost:1234/nested.json#foo");
            expect(result).to.deep.eq({ id: "#foo", type: "integer" });
        });
    });


    describe("spec remoteRef.json", () => {

        it("should resolve remote ref", () => {
            remotes["http://localhost:1234/integer.json"] = compile({ type: "integer" });
            const schema = compile({ $ref: "http://localhost:1234/integer.json" });

            const result = schema.getRef("http://localhost:1234/integer.json");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve remote ref with fragment", () => {
            remotes["http://localhost:1234/subSchemas.json"] = compile({ integer: { type: "integer" } });
            const schema = compile({ $ref: "http://localhost:1234/subSchemas.json#/integer" });

            const result = schema.getRef("http://localhost:1234/subSchemas.json#/integer");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve ref with remote ref", () => {
            remotes["http://localhost:1234/subSchemas.json"] = compile({
                integer: { type: "integer" },
                refToInteger: { $ref: "#/integer" }
            });
            const schema = compile({ $ref: "http://localhost:1234/subSchemas.json#/refToInteger" });

            const result = schema.getRef("http://localhost:1234/subSchemas.json#/refToInteger");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should join scope and resolve to remote", () => {
            remotes["http://localhost:1234/folder/folderInteger.json"] = compile({ type: "integer" });
            const schema = compile({
                id: "http://localhost:1234/",
                items: {
                    id: "folder/",
                    items: { $ref: "folderInteger.json" }
                }
            });

            const result = schema.getRef(schema.items.items);
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should correctly replace base uri for remote scope updates", () => {
            remotes["http://localhost:1234/folder/folderInteger.json"] = compile({ type: "integer" });
            const schema = compile({
                id: "http://localhost:1234/scope_change_defs1.json",
                type: "object",
                properties: {
                    list: { $ref: "#/definitions/baz" }
                },
                definitions: {
                    baz: {
                        id: "folder/",
                        type: "array",
                        items: { $ref: "folderInteger.json" }
                    }
                }
            });

            const result = schema.getRef(schema.definitions.baz.items);
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve joined remote with root ref", () => {
            remotes["http://localhost:1234/name.json"] = compile({
                definitions: {
                    orNull: {
                        anyOf: [{ type: "null" }, { $ref: "#" }]
                    }
                },
                type: "string"
            });
            const schema = compile({
                id: "http://localhost:1234/object",
                type: "object",
                properties: {
                    name: { $ref: "name.json#/definitions/orNull" }
                }
            });

            const result = schema.getRef(schema.properties.name);
            expect(result).to.deep.eq({ anyOf: [{ type: "null" }, { $ref: "#" }] });
        });
    });
});
