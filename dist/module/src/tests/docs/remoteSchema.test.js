import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
describe("docs - remote schema", () => {
    it("should resolve remote schema from given url", () => {
        var _a;
        const node = compileSchema({
            $id: "https://local.com/schemas/root.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "https://remote.com/schemas/character"
                }
            }
        }).addRemote("https://remote.com/schemas/character", {
            title: "character remote schema",
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        });
        const remoteSchema = (_a = node.getRef("https://remote.com/schemas/character")) === null || _a === void 0 ? void 0 : _a.schema;
        assert.deepEqual(remoteSchema.title, "character remote schema", "should have resolved remote root schema");
        const data = node.getData({});
        assert.deepEqual(data, { character: "A" }, "should have retrieved default value from remote schema");
    });
    it.skip("should resolve remote schemas from simple ids", () => {
        var _a;
        const node = compileSchema({
            $id: "https://local.com/schemas/root.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "character"
                }
            }
        }).addRemote("character", {
            title: "character remote schema",
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        });
        const remoteSchema = (_a = node.getRef("character")) === null || _a === void 0 ? void 0 : _a.schema;
        assert.deepEqual(remoteSchema.title, "character remote schema", "should have resolved remote root schema");
        const data = node.getData({});
        assert.deepEqual(data, { character: "A" }, "should have retrieved default value from remote schema");
    });
    it("should resolve $defs from remote schema", () => {
        var _a;
        const node = compileSchema({
            $id: "https://local.com/schema.json",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "https://remote.com/schema.json#/$defs/character"
                }
            }
        }).addRemote("https://remote.com/schema.json", {
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
        const remoteSchema = (_a = node.getRef("https://remote.com/schema.json#/$defs/character")) === null || _a === void 0 ? void 0 : _a.schema;
        assert.deepEqual(remoteSchema, {
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        }, "should have resolved remote definition");
        const data = node.getData({});
        assert.deepEqual(data, { character: "A" }, "should have retrieved default value from remote schema");
    });
    it.skip("should resolve $defs from remote schema using simple ids", () => {
        var _a;
        const node = compileSchema({
            $id: "local",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "remote#/$defs/character"
                }
            }
        }).addRemote("remote", {
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
        const remoteSchema = (_a = node.getRef("remote#/$defs/character")) === null || _a === void 0 ? void 0 : _a.schema;
        assert.deepEqual(remoteSchema, {
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        }, "should have resolved remote definition");
        const data = node.getData({});
        assert.deepEqual(data, { character: "A" }, "should have retrieved default value from remote schema");
    });
    it.skip("should resolve pointer to nested object in remote schema", () => {
        var _a;
        const node = compileSchema({
            $id: "local",
            type: "object",
            required: ["character"],
            properties: {
                character: {
                    $ref: "remote#/properties/character"
                }
            }
        }).addRemote("remote", {
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
        const remoteSchema = (_a = node.getRef("remote#/properties/character")) === null || _a === void 0 ? void 0 : _a.schema;
        assert.deepEqual(remoteSchema, {
            type: "string",
            default: "A",
            maxLength: 1,
            minLength: 1
        }, "should have resolved remote definition");
        const data = node.getData({});
        assert.deepEqual(data, { character: "A" }, "should have retrieved default value from remote schema");
    });
});
