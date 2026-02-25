import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draft07 } from "../../draft07";

describe("issue#93 - boolean schema typescript support", () => {
    it("compileSchema should accept false as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, { drafts: [draft07] });
        const { node } = rootNode.getNode("/test", { name: "hello" });
        assert(node !== undefined);
        assert.equal(node.schema, false);
    });

    it("compileSchema should accept true as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: true } }, { drafts: [draft07] });
        const { node } = rootNode.getNode("/test", { name: "hello" });
        assert(node !== undefined);
        assert.equal(node.schema, true);
    });

    it("getNode should work with boolean schema false", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, { drafts: [draft07] });
        const { node } = rootNode.getNode("/test", {});
        assert(node !== undefined);
        assert.equal(node.schema, false);
    });

    it("getData should work with boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { name: { type: "string" }, test: false } }, { drafts: [draft07] });
        const data = rootNode.getData();
        assert(data !== undefined);
    });

    it("addRemoteSchema should accept boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07" }, { drafts: [draft07] });
        rootNode.addRemoteSchema("http://example.com/bool", false);
        assert(true);
    });

    it("getNodeRoot should work when schema contains boolean schemas", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, { drafts: [draft07] });
        const { node } = rootNode.getNode("/test", {});
        assert(node !== undefined);
        const root = node.getNodeRoot();
        assert(root !== undefined);
    });

    it("compileSchema should accept false as root boolean schema", () => {
        const rootNode = compileSchema(false);
        assert(rootNode !== undefined);
        assert.equal(rootNode.schema, false);
    });

    it("compileSchema should accept true as root boolean schema", () => {
        const rootNode = compileSchema(true);
        assert(rootNode !== undefined);
        assert.equal(rootNode.schema, true);
    });
    it("getNode should work on compileSchema(false)", () => {
        const rootNode = compileSchema(false);
        const { node } = rootNode.getNode("/test", {});
        assert(node === undefined);
    });

    it("getData should work on compileSchema(false)", () => {
        const rootNode = compileSchema(false);
        const data = rootNode.getData();
        assert(data === undefined);
    });

    it("validate should work on compileSchema(false)", () => {
        const rootNode = compileSchema(false);
        const { valid } = rootNode.validate({});
        assert.equal(valid, false);
    });

    it("validate should work on compileSchema(true)", () => {
        const rootNode = compileSchema(true);
        const { valid } = rootNode.validate({});
        assert.equal(valid, true);
    });
});