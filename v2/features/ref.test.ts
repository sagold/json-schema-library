import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";
import { isJsonError } from "../../lib/types";

describe("feature : ref : resolve", () => {
    it("should return undefined for missing reference", () => {
        const node = compileSchema({
            $ref: "#/$defs/header",
            minLength: 1
        }).resolveRef();

        assert.deepEqual(node, undefined);
    });

    it("should resolve $ref from definitions", () => {
        const node = compileSchema({
            $ref: "#/definitions/header",
            definitions: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve $ref from $defs", () => {
        const node = compileSchema({
            $ref: "#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve nested $ref from $defs", () => {
        const _node = compileSchema({
            properties: {
                header: { $ref: "#/$defs/header" }
            },
            $defs: { header: { type: "string", minLength: 1 } }
        }).get("header");
        assert(!isJsonError(_node));
        const node = _node.resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve root pointer, not merging schema", () => {
        const _node = compileSchema({
            type: "object",
            minProperties: 1,
            properties: {
                header: { $ref: "#", minProperties: 2 }
            }
        }).get("header");
        assert(!isJsonError(_node));

        const node = _node.resolveRef();

        assert.deepEqual(node.schema, {
            type: "object",
            minProperties: 1,
            properties: {
                header: { $ref: "#", minProperties: 2 }
            }
        });
    });

    it("should resolve with full domain", () => {
        const node = compileSchema({
            $id: "https://root.schema",
            $ref: "https://root.schema#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { /*$id: "https://root.schema",*/ type: "string", minLength: 1 });
    });

    it("should resolve locally without domain", () => {
        const node = compileSchema({
            $id: "https://root.schema",
            $ref: "#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { /*$id: "https://root.schema",*/ type: "string", minLength: 1 });
    });

    describe("uri encoded pointer", () => {
        it("should resolve url encoded property", () => {
            const node = compileSchema({
                $ref: "#/$defs/header%25title",
                $defs: { "header%title": { type: "string", minLength: 1 } }
            }).resolveRef();

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should resolve ~0 to ~", () => {
            const node = compileSchema({
                $ref: "#/$defs/tilde~0field",
                $defs: { "tilde~field": { type: "string", minLength: 1 } }
            }).resolveRef();

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });

        it("should resolve ~1 to /", () => {
            const node = compileSchema({
                $ref: "#/$defs/slash~1field",
                $defs: { "slash/field": { type: "string", minLength: 1 } }
            }).resolveRef();

            assert.deepEqual(node.schema, { type: "string", minLength: 1 });
        });
    });

    describe("remoteSchema", () => {
        it("should resolve remoteSchema from $ref", () => {
            const node = compileSchema({
                $ref: "https://remote.schema"
            })
                .addRemote("https://remote.schema", { type: "object", minProperties: 1 })
                .resolveRef();

            assert.deepEqual(node.$id, "https://remote.schema");
            assert.deepEqual(node.schema, {
                type: "object",
                minProperties: 1
            });
        });

        it("should resolve $defs in remoteSchema from $ref", () => {
            const node = compileSchema({
                $ref: "https://remote.schema#/$defs/header"
            })
                .addRemote("https://remote.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve $defs in correct remoteSchema from $ref", () => {
            const node = compileSchema({
                $ref: "https://remoteB.schema#/$defs/header"
            })
                .addRemote("https://remoteA.schema", { $defs: { header: { type: "string", minLength: 1 } } })
                .addRemote("https://remoteB.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve $ref to through multiple remoteSchema", () => {
            const node = compileSchema({
                $ref: "https://remoteA.schema"
            })
                .addRemote("https://remoteA.schema", { $ref: "https://remoteB.schema#/$defs/header" })
                .addRemote("https://remoteB.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef()
                .resolveRef()
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve local $ref from remoteSchema in remoteSchema", () => {
            const node = compileSchema({
                $ref: "https://remote.schema"
            })
                .addRemote("https://remote.schema", {
                    $ref: "#/$defs/header",
                    $defs: { header: { type: "object", minProperties: 1 } }
                })
                .resolveRef()
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve remote $ref to origin schema", () => {
            const node = compileSchema({
                $id: "https://root.schema",
                $ref: "https://remote.schema/",
                $defs: { header: { type: "object", minProperties: 1 } }
            })
                .addRemote("https://remote.schema", {
                    $ref: "https://root.schema#/$defs/header"
                })
                .resolveRef()
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });
    });
});

describe("feature : ref : validate", () => {
    it("should return error", () => {
        const errors = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ bar: false });

        assert.equal(errors.length, 1);
    });

    it("should return error for recursive mismatch", () => {
        const errors = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ foo: { bar: false } });

        assert.equal(errors.length, 1);
    });

    it("should resolve base URI change - change folder", () => {
        const node = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            $id: "http://localhost:1234/draft2019-09/scope_change_defs1.json",
            type: "object",
            properties: {
                list: {
                    $ref: "baseUriChangeFolder/"
                }
            },
            $defs: {
                baz: {
                    $id: "baseUriChangeFolder/",
                    type: "array",
                    items: {
                        $ref: "folderInteger.json"
                    }
                }
            }
        });
        // console.log("\nADD REMOTE\n");
        node.addRemote("http://localhost:1234/draft2019-09/baseUriChangeFolder/folderInteger.json", {
            $schema: "https://json-schema.org/draft/2019-09/schema",
            type: "integer"
        });
        // console.log("\nVALIDATE\n");
        const errors = node.validate({ list: [1] });

        assert.equal(errors.length, 0);
    });

    it("should resolve base URI change ref valid", () => {
        const errors = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            $id: "http://localhost:1234/draft2019-09/",
            items: {
                $id: "baseUriChange/",
                items: {
                    $ref: "folderInteger.json"
                }
            }
        })
            .addRemote("http://localhost:1234/draft2019-09/baseUriChange/folderInteger.json", {
                type: "integer"
            })
            .validate([[1]]);

        assert.equal(errors.length, 0);
    });

    // requires anchor
    it("should resolve Location-independent identifier in remote ref", () => {
        const errors = compileSchema({
            $schema: "https://json-schema.org/draft/2019-09/schema",
            $ref: "http://localhost:1234/draft2019-09/locationIndependentIdentifier.json#/$defs/refToInteger"
        })
            .addRemote("http://localhost:1234/draft2019-09/locationIndependentIdentifier.json", {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: {
                    refToInteger: {
                        $ref: "#foo"
                    },
                    A: {
                        $anchor: "foo",
                        type: "integer"
                    }
                }
            })
            .validate("foo");

        assert.equal(errors.length, 1);
    });
});
