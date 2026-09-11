import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draft2020 } from "../../draft2020";
import { extendDraft } from "../../Draft";

// issue#123 — SchemaNode.createSchema was bound to the built-in helper, so a
// custom draft's methods.createSchema was stored on context but never invoked.
describe("issue#123 - custom draft createSchema overrides are never invoked", () => {
    it("should call the draft methods.createSchema override from SchemaNode.createSchema", () => {
        let calls = 0;
        const draft = extendDraft(draft2020, {
            methods: {
                ...draft2020.methods,
                createSchema: (data) => {
                    calls += 1;
                    return { const: data };
                }
            }
        });
        const node = compileSchema({}, { drafts: [draft] });

        assert.equal(typeof node.context.methods.createSchema, "function");
        const result = node.createSchema("value");
        assert.deepEqual(result, { const: "value" });
        assert.equal(calls, 1);
    });

    it("should use the createSchema override when reducing boolean schema true", () => {
        const draft = extendDraft(draft2020, {
            methods: {
                ...draft2020.methods,
                createSchema: (data) => ({ const: data })
            }
        });
        const node = compileSchema(true, { drafts: [draft] });
        const schema = node.reduceNode("value")?.node?.schema;
        assert.deepEqual(schema, { const: "value" });
    });
});
