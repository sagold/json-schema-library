const expect = require("chai").expect;
const Core = require("../../lib/cores/Draft04");
const precompileSchema = require("../../lib/precompileSchema");
const remotes = require("../../remotes");


describe("precompileSchema", () => {

    let core;
    beforeEach(() => (core = new Core({})));
    afterEach(() => remotes.reset());

    it("should return a copy", () => {
        const schema = {};
        const result = precompileSchema(core, schema);

        expect(result).not.to.eq(schema);
    });

    it("should not copy schema twice", () => {
        const schema = precompileSchema(core, {});
        const result = precompileSchema(core, schema);

        expect(result).to.eq(schema);
    });

    it("should not change unresolved $ref", () => {
        const result = precompileSchema(core, {
            type: "object",
            properties: {
                name: { $ref: "my-space.json" }
            }
        });

        expect(result.properties.name.$ref).to.eq("my-space.json");
    });

    it("should not change relative pointer for missing scope", () => {
        const result = precompileSchema(core, {
            type: "object",
            properties: {
                name: { $ref: "#/definitions/string" }
            }
        });

        expect(result.properties.name.$ref).to.eq("#/definitions/string");
    });

    it("should resolve relative references to absolute references", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                name: { $ref: "my-space.json" }
            }
        });

        expect(result.properties.name.$ref).to.eq("http://my-schema/my-space.json");
    });

    it("should not remove fragment pointer when resolving relative url", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                name: { $ref: "my-space.json#/room" }
            }
        });

        expect(result.properties.name.$ref).to.eq("http://my-schema/my-space.json#/room");
    });

    it("should add scope to relative $ref", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                name: { $ref: "#/room" }
            }
        });

        expect(result.properties.name.$ref).to.eq("http://my-schema/#/room");
    });

    it("should add scope containing filename to relative $ref", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/name.json",
            type: "object",
            properties: {
                name: { $ref: "#/room" }
            }
        });

        expect(result.properties.name.$ref).to.eq("http://my-schema/name.json#/room");
    });

    it("should update nested root changes", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                emma: {
                    id: "http://my-emma/",
                    type: "object",
                    properties: {
                        name: { $ref: "my-space.json#/room" }
                    }
                }
            }
        });

        expect(result.properties.emma.properties.name.$ref).to.eq("http://my-emma/my-space.json#/room");
    });

    it("should update sibling root changes", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                emma: {
                    id: "http://my-emma/",
                    type: "object",
                    properties: {
                        name: { $ref: "my-space.json#/room" }
                    }
                },
                hans: {
                    id: "http://my-hans/",
                    type: "object",
                    properties: {
                        name: { $ref: "my-space.json#/room" }
                    }
                }
            }
        });

        expect(result.properties.emma.properties.name.$ref).to.eq("http://my-emma/my-space.json#/room");
        expect(result.properties.hans.properties.name.$ref).to.eq("http://my-hans/my-space.json#/room");
    });

    it("should add relative ids to baseUrl", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/",
            type: "object",
            properties: {
                emma: {
                    id: "emma",
                    type: "object",
                    properties: {
                        name: { $ref: "my-space.json#/room" }
                    }
                }
            }
        });

        expect(result.properties.emma.properties.name.$ref).to.eq("http://my-schema/emma/my-space.json#/room");
    });

    it("should strip filename from baseUrl when joining", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/test.json",
            type: "object",
            properties: {
                emma: {
                    id: "emma",
                    type: "object",
                    properties: {
                        name: { $ref: "my-space.json#/room" }
                    }
                }
            }
        });

        expect(result.properties.emma.properties.name.$ref).to.eq("http://my-schema/emma/my-space.json#/room");
    });

    it("should strip filename from baseUrl when joining $ref", () => {
        const result = precompileSchema(core, {
            id: "http://my-schema/test",
            type: "object",
            properties: {
                name: { $ref: "my-space.json#/room" }
            }
        });

        expect(result.properties.name.$ref).to.eq("http://my-schema/my-space.json#/room");
    });

    it("should update nested items definition, not requiring a type definition", () => {
        const result = precompileSchema(core, {
            id: "http://localhost:1234/",
            type: "array",
            items: {
                id: "folder/",
                items: { $ref: "folderInteger.json" }
            }
        });

        expect(result.items.items.$ref).to.eq("http://localhost:1234/folder/folderInteger.json");
    });


    describe("id", () => {

        it("should add to all schema definitions", () => {
            const id = "http://my-schema/";
            const result = precompileSchema(core, {
                id,
                type: "object",
                properties: {
                    emma: {
                        type: "object",
                        properties: {
                            name: { $ref: "my-space.json#/room" }
                        }
                    }
                }
            });

            expect(result.id).to.eq(id);
            expect(result.properties.emma.id).to.eq(id);
            expect(result.properties.emma.properties.name.id).to.eq(id);
        });

        it("should update correct ids to schema definitions", () => {
            const result = precompileSchema(core, {
                id: "http://my-schema/",
                type: "object",
                properties: {
                    emma: {
                        id: "my-space",
                        type: "object",
                        properties: {
                            name: {
                                id: "http://my-emma/",
                                $ref: "my-space.json#/room"
                            }
                        }
                    }
                }
            });

            expect(result.id).to.eq("http://my-schema/");
            expect(result.properties.emma.id).to.eq("http://my-schema/my-space/");
            expect(result.properties.emma.properties.name.id).to.eq("http://my-emma/");
        });

        it("should add correct ids to schema definitions", () => {
            const result = precompileSchema(core, {
                id: "http://my-schema/test.json",
                type: "object",
                properties: {
                    list: {
                        type: "array"
                    }
                },
                definitions: {
                    baz: { id: "folder/" }
                }
            });

            expect(result.properties.list.id).to.eq("http://my-schema/test.json");
            expect(result.definitions.baz.id).to.eq("http://my-schema/folder/");
        });

        // it.only("should update ids in subschema", () => {
        //     const result = precompileSchema(core, {
        //         id: "http://localhost:1234/scope_change_defs2.json",
        //         type: "object",
        //         properties: {
        //             list: { $ref: "#/definitions/baz/definitions/bar" }
        //         },
        //         definitions: {
        //             baz: {
        //                 id: "folder/",
        //                 definitions: {
        //                     bar: {
        //                         type: "array",
        //                         items: { $ref: "folderInteger.json" }
        //                     }
        //                 }
        //             }
        //         }
        //     });

        //     console.log(JSON.stringify(result, null, 4));
        // });

    });


    describe("remotes", () => {

        it("should add the root scope to remotes", () => {
            const result = precompileSchema(core, {
                id: "http://my-schema/",
                type: "object",
                properties: {}
            });

            expect(remotes["http://my-schema/"]).to.eq(result);
        });

        it("should add each changing scope to remotes", () => {
            const result = precompileSchema(core, {
                id: "http://my-schema/",
                type: "object",
                properties: {
                    emma: {
                        id: "my-space",
                        type: "object",
                        properties: {
                            name: {
                                id: "http://my-emma/",
                                $ref: "my-space.json#/room"
                            }
                        }
                    }
                }
            });

            expect(remotes["http://my-schema/"]).to.eq(result);
            expect(remotes["http://my-schema/my-space/"]).to.eq(result.properties.emma);
            expect(remotes["http://my-emma/"]).to.eq(result.properties.emma.properties.name);
        });
    });
});
