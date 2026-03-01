import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("issue#93 - boolean schema typescript support", () => {
    it("compileSchema should accept false as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-2020-12", properties: { test: false } });
        const { node } = rootNode.getNode("test", { name: "hello" });
        assert(node);
        assert.equal(node.schema, false);
    });

    it("compileSchema should accept true as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-2020-12", properties: { test: true } });
        const nodeChildResult = rootNode.getNodeChild("test", { name: "hello" });
        assert(nodeChildResult.node);
        assert.equal(nodeChildResult.node.schema, true);

        const { node } = rootNode.getNode("test", { name: "hello" });
        assert(node);
        assert.deepEqual(node.schema, {}, "reduced boolean schema `true` should have been converted to schema-object");
    });

    it("getNode should work with boolean schema false", () => {
        const rootNode = compileSchema({ $schema: "draft-2020-12", properties: { test: false } });
        const { node } = rootNode.getNode("/test", {});
        assert(node);
        assert.equal(node.schema, false);
    });

    it("getData should work with boolean schema", () => {
        const rootNode = compileSchema({
            $schema: "draft-2020-12",
            properties: { name: { type: "string" }, test: false }
        });
        const data = rootNode.getData();
        assert(data);
    });

    it("addRemoteSchema should accept boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-2020-12" });
        rootNode.addRemoteSchema("http://example.com/bool", false);
        assert(true);
    });

    it("getNodeRoot should work when schema contains boolean schemas", () => {
        const rootNode = compileSchema({ $schema: "draft-2020-12", properties: { test: false } });
        const { node } = rootNode.getNode("/test", {});
        assert(node);
        const root = node.getNodeRoot();
        assert(root);
    });

    it("compileSchema should accept false as root boolean schema", () => {
        const rootNode = compileSchema(false);
        assert(rootNode);
        assert.equal(rootNode.schema, false);
    });

    it("compileSchema should accept true as root boolean schema", () => {
        const rootNode = compileSchema(true);
        assert(rootNode);
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
