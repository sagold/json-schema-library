import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draft07 } from "../../draft07";

describe("issue#93 - boolean schema typescript support", () => {
    it("compileSchema should accept false as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, [draft07]);
        const { node } = rootNode.getNode("/test", { name: "hello" });
        assert(node !== undefined);
        assert.equal(node.schema, false);
    });

    it("compileSchema should accept true as boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: true } }, [draft07]);
        const { node } = rootNode.getNode("/test", { name: "hello" });
        assert(node !== undefined);
        assert.equal(node.schema, true);
    });

    it("getNode should work with boolean schema false", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, [draft07]);
        const { node } = rootNode.getNode("/test", {});
        assert(node !== undefined);
        assert.equal(node.schema, false);
    });

    it("getData should work with boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { name: { type: "string" }, test: false } }, [draft07]);
        const data = rootNode.getData();
        assert(data !== undefined);
    });

    it("addRemoteSchema should accept boolean schema", () => {
        const rootNode = compileSchema({ $schema: "draft-07" }, [draft07]);
        rootNode.addRemoteSchema("http://example.com/bool", false);
        assert(true);
    });

    it("getNodeRoot should work when schema contains boolean schemas", () => {
        const rootNode = compileSchema({ $schema: "draft-07", properties: { test: false } }, [draft07]);
        const { node } = rootNode.getNode("/test", {});
        assert(node !== undefined);
        const root = node.getNodeRoot();
        assert(root !== undefined);
    });
});