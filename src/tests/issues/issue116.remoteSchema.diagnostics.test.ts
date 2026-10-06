import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("issue#116 - addRemoteSchema overwrites earlier remote schema diagnostics", () => {
    it("should keep diagnostics from all invalid remotes, not just the last one", () => {
        const remotes = [
            { $id: "https://a.example/schema", anyOf: [999] },
            { $id: "https://b.example/schema", type: "invalid-type" }
        ];

        // @ts-expect-error remotes are intentionally invalid schemas for this test
        const node = compileSchema({}, { remotes });

        assert.equal(node.schemaErrors.length, 2, "errors from both remotes should be retained");

        const pointers = node.schemaErrors.map((error) => error.data.pointer).sort();
        assert.deepEqual(pointers, ["#/anyOf/0", "#/type"]);

        const schemaIds = node.schemaErrors.map((error) => error.data.schemaId).sort();
        assert.deepEqual(schemaIds, ["https://a.example/schema", "https://b.example/schema"]);
    });

    it("control: a single invalid remote still reports its error with schemaId", () => {
        const remotes = [{ $id: "https://a.example/schema", anyOf: [999] }];

        // @ts-expect-error remotes are intentionally invalid schemas for this test
        const node = compileSchema({}, { remotes });

        assert.equal(node.schemaErrors.length, 1);
        assert.equal(node.schemaErrors[0].data.pointer, "#/anyOf/0");
        assert.equal(node.schemaErrors[0].data.schemaId, "https://a.example/schema");
    });
});
