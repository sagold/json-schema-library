import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema.js";

describe("issue#33 - root oneOf changes type", () => {
    it("should return false for root array", () => {
        const { errors } = compileSchema({
            $schema: "http://json-schema.org/draft-07/schema",
            oneOf: [{ type: "string" }, { type: "number" }]
        }).validate([]);
        assert.notEqual(errors.length, 0);
    });

    describe("type array", () => {
        it("should return false for root array", () => {
            const { errors } = compileSchema({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            }).validate([]);
            assert.notEqual(errors.length, 0);
        });

        it("should return false for root boolean", () => {
            const { errors } = compileSchema({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            }).validate(false);
            assert.notEqual(errors.length, 0);
        });

        it("should return true for root string", () => {
            const { errors } = compileSchema({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            }).validate("");
            assert.equal(errors.length, 0);
        });

        it("should return true for root number", () => {
            const { errors } = compileSchema({
                type: ["string", "number"],
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            }).validate("");
            assert.equal(errors.length, 0);
        });
    });

    describe("variations", () => {
        it("should return false for property array", () => {
            const { errors } = compileSchema({
                $schema: "http://json-schema.org/draft-07/schema",
                type: "object",
                required: ["test"],
                properties: {
                    test: {
                        oneOf: [{ type: "string" }, { type: "number" }]
                    }
                }
            }).validate({ test: [] });
            assert.notEqual(errors.length, 0);
        });

        it("should return false for property boolean", () => {
            const { errors } = compileSchema({
                $schema: "http://json-schema.org/draft-07/schema",
                oneOf: [{ type: "string" }, { type: "number" }]
            }).validate(true);
            assert.notEqual(errors.length, 0);
        });
    });
});
