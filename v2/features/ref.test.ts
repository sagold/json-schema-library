import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";
import { isJsonError } from "../../lib/types";

describe("feature : ref : resolve", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return undefined for missing reference", () => {
        const node = compileSchema(draft, {
            $ref: "#/$defs/header",
            minLength: 1
        }).resolveRef();

        assert.deepEqual(node, undefined);
    });

    it("should resolve $ref from definitions", () => {
        const node = compileSchema(draft, {
            $ref: "#/definitions/header",
            definitions: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve $ref from $defs", () => {
        const node = compileSchema(draft, {
            $ref: "#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve nested $ref from $defs", () => {
        const _node = compileSchema(draft, {
            properties: {
                header: { $ref: "#/$defs/header" }
            },
            $defs: { header: { type: "string", minLength: 1 } }
        }).get("header");
        assert(!isJsonError(_node));
        const node = _node.resolveRef();

        assert.deepEqual(node.schema, { type: "string", minLength: 1 });
    });

    it("should resolve root pointer, merging schema", () => {
        const _node = compileSchema(draft, {
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
            minProperties: 2,
            properties: {
                header: { $ref: "#", minProperties: 2 }
            }
        });
    });

    it("should resolve with full domain", () => {
        const node = compileSchema(draft, {
            $id: "https://root.schema",
            $ref: "https://root.schema#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { $id: "https://root.schema", type: "string", minLength: 1 });
    });

    it("should resolve locally without domain", () => {
        const node = compileSchema(draft, {
            $id: "https://root.schema",
            $ref: "#/$defs/header",
            $defs: { header: { type: "string", minLength: 1 } }
        }).resolveRef();

        assert.deepEqual(node.schema, { $id: "https://root.schema", type: "string", minLength: 1 });
    });

    describe("remoteSchema", () => {
        it("should resolve remoteSchema from $ref", () => {
            const node = compileSchema(draft, {
                $ref: "https://remote.schema"
            })
                .addRemote("https://remote.schema", { type: "object", minProperties: 1 })
                .resolveRef();

            assert.deepEqual(node.schema, { $id: "https://remote.schema", type: "object", minProperties: 1 });
        });

        it("should resolve $defs in remoteSchema from $ref", () => {
            const node = compileSchema(draft, {
                $ref: "https://remote.schema#/$defs/header"
            })
                .addRemote("https://remote.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve $defs in correct remoteSchema from $ref", () => {
            const node = compileSchema(draft, {
                $ref: "https://remoteB.schema#/$defs/header"
            })
                .addRemote("https://remoteA.schema", { $defs: { header: { type: "string", minLength: 1 } } })
                .addRemote("https://remoteB.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve $ref to through multiple remoteSchema", () => {
            const node = compileSchema(draft, {
                $ref: "https://remoteA.schema"
            })
                .addRemote("https://remoteA.schema", { $ref: "https://remoteB.schema#/$defs/header" })
                .addRemote("https://remoteB.schema", { $defs: { header: { type: "object", minProperties: 1 } } })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it("should resolve local $ref from remoteSchema in remoteSchema", () => {
            const node = compileSchema(draft, {
                $ref: "https://remote.schema"
            })
                .addRemote("https://remote.schema", {
                    $ref: "#/$defs/header",
                    $defs: { header: { type: "object", minProperties: 1 } }
                })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });

        it.skip("should resolve remote $ref to origin schema", () => {
            const node = compileSchema(draft, {
                $id: "https://root.schema/",
                $ref: "https://remote.schema/",
                $defs: { header: { type: "object", minProperties: 1 } }
            })
                .addRemote("https://remote.schema/", {
                    $ref: "https://root.schema#/$defs/header"
                })
                .resolveRef();

            assert.deepEqual(node.schema, { type: "object", minProperties: 1 });
        });
    });
});

describe("feature : ref : validate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return error", () => {
        const errors = compileSchema(draft, {
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ bar: false });

        assert.equal(errors.length, 1);
    });

    it("should return error for recursive mismatch", () => {
        const errors = compileSchema(draft, {
            $schema: "https://json-schema.org/draft/2019-09/schema",
            properties: { foo: { $ref: "#" } },
            additionalProperties: false
        }).validate({ foo: { bar: false } });

        assert.equal(errors.length, 1);
    });
});
