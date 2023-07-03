import { strict as assert } from "assert";
import { Draft07 } from "../../../lib/draft07";

describe("docs - remote schema", () => {
    let draft: Draft07;
    beforeEach(() => (draft = new Draft07()));

    it("should resolve remote schema from given url", () => {
        draft.addRemoteSchema("https://remote.com/schemas/character", {
            title: "character remote schema",
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        });

        draft.setSchema({
            $id: "https://local.com/schemas/root.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "https://remote.com/schemas/character"
                }
            }
        });

        const remoteSchema = draft.getSchema().getRef("https://remote.com/schemas/character");
        assert.deepEqual(
            remoteSchema.title,
            "character remote schema",
            "should have resolved remote root schema"
        );

        const data = draft.getTemplate({});
        assert.deepEqual(
            data,
            { character: "A" },
            "should have retrieved default value from remote schema"
        );
    });

    it("should resolve remote schemas from simple ids", () => {
        draft.addRemoteSchema("character", {
            title: "character remote schema",
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        });

        draft.setSchema({
            $id: "https://local.com/schemas/root.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "character"
                }
            }
        });

        const remoteSchema = draft.getSchema().getRef("character");
        assert.deepEqual(
            remoteSchema.title,
            "character remote schema",
            "should have resolved remote root schema"
        );

        const data = draft.getTemplate({});
        assert.deepEqual(
            data,
            { character: "A" },
            "should have retrieved default value from remote schema"
        );
    });

    it("should resolve $defs from remote schema", () => {
        draft.addRemoteSchema("https://remote.com/schema.json", {
            title: "$defs remote schema",
            $defs: {
                character: {
                    type: "string",
                    default: "A",
                    maxLength: 1,
                    minLength: 1
                }
            }
        });

        draft.setSchema({
            $id: "https://local.com/schema.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "https://remote.com/schema.json#/$defs/character"
                }
            }
        });

        const remoteSchema = draft
            .getSchema()
            .getRef("https://remote.com/schema.json#/$defs/character");
        assert.deepEqual(
            remoteSchema,
            {
                type: "string",
                default: "A",
                maxLength: 1,
                minLength: 1
            },
            "should have resolved remote definition"
        );

        const data = draft.getTemplate({});
        assert.deepEqual(
            data,
            { character: "A" },
            "should have retrieved default value from remote schema"
        );
    });

    it("should resolve $defs from remote schema using simple ids", () => {
        draft.addRemoteSchema("remote", {
            title: "$defs remote schema",
            $defs: {
                character: {
                    type: "string",
                    default: "A",
                    maxLength: 1,
                    minLength: 1
                }
            }
        });

        draft.setSchema({
            $id: "local",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "remote#/$defs/character"
                }
            }
        });

        const remoteSchema = draft.getSchema().getRef("remote#/$defs/character");
        assert.deepEqual(
            remoteSchema,
            {
                type: "string",
                default: "A",
                maxLength: 1,
                minLength: 1
            },
            "should have resolved remote definition"
        );

        const data = draft.getTemplate({});
        assert.deepEqual(
            data,
            { character: "A" },
            "should have retrieved default value from remote schema"
        );
    });

    it("should resolve pointer to nested object in remote schema", () => {
        draft.addRemoteSchema("remote", {
            type: "object",
            properties: {
                character: {
                    type: "string",
                    default: "A",
                    maxLength: 1,
                    minLength: 1
                }
            }
        });

        draft.setSchema({
            $id: "local",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "remote#/properties/character"
                }
            }
        });

        const remoteSchema = draft.getSchema().getRef("remote#/properties/character");
        assert.deepEqual(
            remoteSchema,
            {
                type: "string",
                default: "A",
                maxLength: 1,
                minLength: 1
            },
            "should have resolved remote definition"
        );

        const data = draft.getTemplate({});
        assert.deepEqual(
            data,
            { character: "A" },
            "should have retrieved default value from remote schema"
        );
    });
});
