import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { extendDraft } from "./Draft";
import { draft2020 } from "./draft2020";

describe("Draft.extendDraft", () => {
    it("should add format validator", () => {
        const draft = extendDraft(draft2020, {
            formats: {
                test: ({ data, node, pointer }) => {
                    if (data === "test") {
                        return node.createError("invalid-data-error", {
                            schema: node.schema,
                            pointer: pointer,
                            value: data
                        });
                    }
                }
            }
        });
        const { errors } = compileSchema({ format: "test" }, { drafts: [draft] }).validate("test");
        assert.equal(errors.length, 1, "should have return a single error");
        assert.equal(errors.length, 1, "should have return a single error");
    });

    describe("methods.createSchema", () => {
        const draft = extendDraft(draft2020, {
            methods: { createSchema: (data) => ({ type: "string", title: `custom:${typeof data}` }) }
        });

        it("should use custom createSchema in node.createSchema", () => {
            const node = compileSchema({}, { drafts: [draft] });
            assert.deepEqual(node.createSchema(1), { type: "string", title: "custom:number" });
        });

        it("should use custom createSchema for `items:true`", () => {
            const node = compileSchema({ type: "array", items: true }, { drafts: [draft] });
            const { node: child } = node.getNodeChild(0, [1], { createSchema: true });
            assert.equal(child?.schema.title, "custom:number");
        });

        it("should use custom createSchema for missing properties", () => {
            const node = compileSchema({ type: "object" }, { drafts: [draft] });
            const { node: child } = node.getNode("#/a", { a: 1 }, { createSchema: true });
            assert.equal(child?.schema.title, "custom:number");
        });

        it("should use custom createSchema for boolean `true` schema", () => {
            const node = compileSchema({ properties: { a: true } }, { drafts: [draft] });
            const { node: child } = node.getNode("#/a", { a: 1 });
            assert.equal(child?.schema.title, "custom:number");
        });
    });
});
