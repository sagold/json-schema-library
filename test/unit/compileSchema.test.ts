import { expect } from "chai";
import compile from "../../lib/compile";
import copy from "../../lib/utils/copy";
import { Draft04 } from "../../lib/draft04";
import draft04Schema from "../../remotes/draft04.json";

describe("compile", () => {
    const FORCE_COMPILATION = true;
    let draft: Draft04;
    beforeEach(() => {
        draft = new Draft04();
    });

    describe("behaviour", () => {
        it("should return undefined for missing schema", () => {
            // @ts-ignore
            expect(compile(draft)).to.eq(undefined);
        });

        it("should return a copy", () => {
            const schema = {};
            const result = compile(draft, schema);

            expect(result).not.to.eq(schema);
        });

        it("should not copy schema twice", () => {
            const schema = compile(draft, {});
            const result = compile(draft, schema);

            expect(result).to.eq(schema);
        });

        it("should not change iterable properties", () => {
            const originalSchema = copy(draft04Schema);
            const result = compile(draft, originalSchema);

            expect(result).to.deep.eq(originalSchema);
        });
    });

    describe("getRef", () => {
        it("should always return json-pointer target", () => {
            const schema = compile(draft, {
                type: "object",
                defs: {
                    key: { type: "any" }
                }
            });

            const result = schema.getRef("#/defs/key");

            expect(result).to.deep.eq({ type: "any" });
        });

        it("should return a defined $ref with json-pointer", () => {
            const schema = compile(draft, {
                type: "object",
                properties: {
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
            const schema = compile(draft, {
                type: "object",
                properties: {
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
            const schema = compile(draft, {
                id: "http://localhost.com/#",
                type: "object",
                properties: {
                    ref: { $ref: "http://localhost.com/folder#target" }
                },
                definitions: {
                    intermediate: {
                        id: "folder",
                        type: "object",
                        properties: {
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
            const schema = compile(draft, {
                id: "http://localhost.com/#",
                type: "object",
                properties: {
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

        // root schema reference
        it("should return schema defined with referenced ids from root schema", () => {
            const rootSchema = compile(draft, {
                definitions: {
                    target: { id: "#target", type: "any" }
                }
            });

            const schema = compile(
                draft,
                {
                    type: "object",
                    properties: {
                        ref: { $ref: "#/any/ref" }
                    }
                },
                rootSchema
            );

            const result = schema.getRef("#target");
            // console.log("SCHEMA", JSON.stringify(schema, null, 2));

            expect(result).to.deep.eq({ id: "#target", type: "any" });
        });

        it("should return schema defined with referenced ids not using root schema", () => {
            const rootSchema = compile(draft, { type: "object" });

            const schema = compile(
                draft,
                {
                    type: "object",
                    properties: {
                        ref: { $ref: "#/any/ref" }
                    },
                    definitions: {
                        target: { id: "#target", type: "any" }
                    }
                },
                rootSchema
            );

            const result = schema.getRef("#target");
            // console.log("SCHEMA", JSON.stringify(schema, null, 2));

            expect(result).to.deep.eq({ id: "#target", type: "any" });
        });
    });

    describe("compile ref", () => {
        it("should compile ref to absolute scope", () => {
            const schema = compile(draft, {
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
            const schema = compile(draft, {
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

            expect(schema.definitions.node.properties.subtree.__ref).to.eq(
                "http://localhost:1234/tree"
            );
        });

        it("should resolve absolute url with subfolder", () => {
            const schema = compile(draft, {
                id: "http://localhost:1234/",
                items: {
                    id: "baseUriChange/",
                    items: { $ref: "folderInteger.json" }
                }
            });

            expect(schema.items.items.__ref).to.eq(
                "http://localhost:1234/baseUriChange/folderInteger.json"
            );
        });
    });

    describe("getRef remote", () => {
        it("should resolve remotes", () => {
            draft.remotes["http://remotehost.com/schema"] = compile(draft, { type: "integer" });
            const schema = compile(draft, { $ref: "http://remotehost.com/schema" });

            const result = schema.getRef("http://remotehost.com/schema");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve remotes with trailing '#'", () => {
            draft.remotes["http://remotehost.com/schema"] = compile(draft, { type: "integer" });
            const schema = compile(draft, { $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve pointer within remote", () => {
            draft.remotes["http://remotehost.com/schema"] = compile(draft, {
                definitions: { target: { type: "integer" } }
            });
            const schema = compile(draft, { $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#/definitions/target");

            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve id within remote", () => {
            const schemaToCompile = {
                definitions: { target: { id: "#r", type: "integer" } }
            };
            draft.remotes["http://remotehost.com/schema"] = compile(
                draft,
                schemaToCompile,
                schemaToCompile,
                FORCE_COMPILATION
            );
            const schema = compile(draft, { $ref: "http://remotehost.com/schema#" });

            const result = schema.getRef("http://remotehost.com/schema#r");

            expect(result).to.deep.eq({ id: "#r", type: "integer" });
        });
    });

    describe("spec ref.json", () => {
        it("should return root", () => {
            const schema = compile(draft, { properties: { foo: { $ref: "#" } } });
            const result = schema.getRef("#");
            expect(result).to.deep.eq({ properties: { foo: { $ref: "#" } } });
        });

        it("should return relative pointer", () => {
            const schema = compile(draft, {
                properties: { foo: { type: "integer" }, bar: { $ref: "#/properties/foo" } }
            });
            const result = schema.getRef("#/properties/foo");
            expect(result).to.deep.equal({ type: "integer" });
        });

        it("should work on escaped pointer", () => {
            const schema = compile(draft, {
                "tilda~field": { type: "integer" },
                "slash/field": { type: "integer" },
                "percent%field": { type: "integer" }
            });

            expect(schema.getRef("#/tilda~0field")).to.deep.equal({ type: "integer" });
            expect(schema.getRef("#/slash~1field")).to.deep.equal({ type: "integer" });
            expect(schema.getRef("#/percent%25field")).to.deep.equal({ type: "integer" });
        });

        it("should resolve nested $ref", () => {
            const schema = compile(draft, {
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
            const schema = compile(draft, { definitions: { 'foo"bar': { type: "number" } } });

            const result = schema.getRef("#/definitions/foo%22bar");
            expect(result).to.deep.equal({ type: "number" });
        });

        it("should resolve location independent identifier", () => {
            const schemaToCompile = { definitions: { A: { id: "#foo", type: "integer" } } };
            const schema = compile(draft, schemaToCompile, schemaToCompile, FORCE_COMPILATION);

            const result = schema.getRef("#foo");
            expect(result).to.deep.equal({ id: "#foo", type: "integer" });
        });

        it("should resolve location independent identifier with base uri change in subschema", () => {
            const schemaToCompile = {
                id: "http://localhost:1234/root",
                definitions: {
                    A: {
                        id: "nested.json",
                        definitions: {
                            B: { id: "#foo", type: "integer" }
                        }
                    }
                }
            };
            const schema = compile(draft, schemaToCompile, schemaToCompile, FORCE_COMPILATION);

            const result = schema.getRef("http://localhost:1234/nested.json#foo");
            expect(result).to.deep.eq({ id: "#foo", type: "integer" });
        });
    });

    describe("draft04Schema spec remoteRef.json", () => {
        it("should resolve remote ref", () => {
            draft.remotes["http://localhost:1234/integer.json"] = compile(draft, {
                type: "integer"
            });
            const schema = compile(draft, { $ref: "http://localhost:1234/integer.json" });

            const result = schema.getRef("http://localhost:1234/integer.json");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve remote ref with fragment", () => {
            draft.remotes["http://localhost:1234/subSchemas.json"] = compile(draft, {
                integer: { type: "integer" }
            });
            const schema = compile(draft, {
                $ref: "http://localhost:1234/subSchemas.json#/integer"
            });

            const result = schema.getRef("http://localhost:1234/subSchemas.json#/integer");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve ref with remote ref", () => {
            draft.remotes["http://localhost:1234/subSchemas.json"] = compile(draft, {
                integer: { type: "integer" },
                refToInteger: { $ref: "#/integer" }
            });
            const schema = compile(draft, {
                $ref: "http://localhost:1234/subSchemas.json#/refToInteger"
            });

            const result = schema.getRef("http://localhost:1234/subSchemas.json#/refToInteger");
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should join scope and resolve to remote", () => {
            draft.remotes["http://localhost:1234/baseUriChange/folderInteger.json"] = compile(
                draft,
                {
                    type: "integer"
                }
            );
            const schema = compile(draft, {
                id: "http://localhost:1234/",
                items: {
                    id: "baseUriChange/",
                    items: { $ref: "folderInteger.json" }
                }
            });

            const result = schema.getRef(schema.items.items);
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should correctly replace base uri for remote scope updates", () => {
            draft.remotes["http://localhost:1234/baseUriChange/folderInteger.json"] = compile(
                draft,
                {
                    type: "integer"
                }
            );
            const schema = compile(draft, {
                id: "http://localhost:1234/scope_change_defs1.json",
                type: "object",
                properties: {
                    list: { $ref: "#/definitions/baz" }
                },
                definitions: {
                    baz: {
                        id: "baseUriChange/",
                        type: "array",
                        items: { $ref: "folderInteger.json" }
                    }
                }
            });

            const result = schema.getRef(schema.definitions.baz.items);
            expect(result).to.deep.eq({ type: "integer" });
        });

        it("should resolve joined remote with root ref", () => {
            draft.remotes["http://localhost:1234/name.json"] = compile(draft, {
                definitions: {
                    orNull: {
                        anyOf: [{ type: "null" }, { $ref: "#" }]
                    }
                },
                type: "string"
            });
            const schema = compile(draft, {
                id: "http://localhost:1234/object",
                type: "object",
                properties: {
                    name: { $ref: "name.json#/definitions/orNull" }
                }
            });

            const result = schema.getRef(schema.properties.name);
            expect(result).to.deep.eq({ anyOf: [{ type: "null" }, { $ref: "#" }] });
        });

        describe("base URI change", () => {
            let validator;
            beforeEach(() => {
                draft.remotes["http://localhost:1234/baseUriChange/folderInteger.json"] = compile(
                    draft,
                    {
                        type: "integer"
                    }
                );
                const schema = compile(draft, {
                    id: "http://localhost:1234/",
                    items: {
                        id: "baseUriChange/",
                        items: { $ref: "folderInteger.json" }
                    }
                });
                validator = new Draft04(schema);
            });

            it("base URI change ref valid", () => {
                expect(validator.isValid([[1]])).to.eq(true);
            });

            it("base URI change ref invalid", () => {
                expect(validator.isValid([["a"]])).to.eq(false);
            });
        });

        describe("base URI change - change folder", () => {
            let validator;
            beforeEach(() => {
                draft.remotes["http://localhost:1234/baseUriChangeFolder/folderInteger.json"] =
                    compile(draft, {
                        type: "integer"
                    });
                const schema = compile(draft, {
                    id: "http://localhost:1234/scope_change_defs1.json",
                    type: "object",
                    properties: {
                        list: { $ref: "#/definitions/baz" }
                    },
                    definitions: {
                        baz: {
                            id: "baseUriChangeFolder/",
                            type: "array",
                            items: { $ref: "folderInteger.json" }
                        }
                    }
                });
                validator = new Draft04(schema);
            });

            it("number is valid", () => {
                expect(validator.isValid({ list: [1] })).to.eq(true);
            });

            it("string is invalid", () => {
                expect(validator.isValid({ list: ["a"] })).to.eq(false);
            });
        });
    });
});
