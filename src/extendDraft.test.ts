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
});
