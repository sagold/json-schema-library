import { strict as assert } from "assert";
import { Draft07 } from "../../../lib/draft07";

describe("issue#33 - root oneOf changes type", () => {
    let draft: Draft07;

    it("should return false for root array", () => {
        draft = new Draft07({
            $schema: "http://json-schema.org/draft-07/schema",
            oneOf: [{ type: "string" }, { type: "number" }]
        });
        const valid = draft.validate([]);
        assert.notEqual(valid.length, 0);
    });

    describe("type array", () => {
        it("should return false for root array", () => {
            draft = new Draft07({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            const errors = draft.validate([]);
            assert.notEqual(errors.length, 0);
        });

        it("should return false for root boolean", () => {
            draft = new Draft07({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            const errors = draft.validate(false);
            assert.notEqual(errors.length, 0);
        });

        it("should return true for root string", () => {
            draft = new Draft07({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            const errors = draft.validate("");
            assert.equal(errors.length, 0);
        });

        it("should return true for root number", () => {
            draft = new Draft07({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            const errors = draft.validate("");
            assert.equal(errors.length, 0);
        });
    });

    describe("variations", () => {
        it("should return false for property array", () => {
            draft = new Draft07({
                $schema: "http://json-schema.org/draft-07/schema",
                type: "object",
                required: ["test"],
                properties: {
                    test: {
                        oneOf: [{ type: "string" }, { type: "number" }]
                    }
                }
            });
            const errors = draft.validate({ test: [] });
            assert.notEqual(errors.length, 0);
        });

        it("should return false for property boolean", () => {
            draft = new Draft07({
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            const errors = draft.validate(true);
            assert.notEqual(errors.length, 0);
        });
    });
});
