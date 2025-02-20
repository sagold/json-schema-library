import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : object : validate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    describe("maxProperties", () => {
        it("should return an error if maxProperties is exceeded", () => {
            const node = compileSchema(draft, {
                type: "object",
                maxProperties: 1
            });

            const errors = node.validate({ a: "1", b: "2" });

            assert.equal(errors.length, 1);
            assert.deepEqual(errors[0].code, "max-properties-error");
        });

        it("should NOT return an error if property count is equal to maxProperties", () => {
            const node = compileSchema(draft, {
                type: "object",
                maxProperties: 2
            });

            const errors = node.validate({ a: "1", b: "2" });

            assert.equal(errors.length, 0);
        });

        it("should return an error if maxProperties of nested properties is exceeded", () => {
            // tests validation walking through properties
            const node = compileSchema(draft, {
                type: "object",
                properties: {
                    header: {
                        type: "object",
                        maxProperties: 1
                    }
                }
            });

            const errors = node.validate({ header: { a: "1", b: "2" } });

            assert.equal(errors.length, 1);
            assert.deepEqual(errors[0].code, "max-properties-error");
        });
    });

    describe("minProperties", () => {
        it("should return an error if property count is below minProperties ", () => {
            const node = compileSchema(draft, {
                type: "object",
                minProperties: 2
            });

            const errors = node.validate({ a: "1" });

            assert.equal(errors.length, 1);
            assert.deepEqual(errors[0].code, "min-properties-error");
        });

        it("should NOT return an error if property count is equal to minProperties ", () => {
            const node = compileSchema(draft, {
                type: "object",
                minProperties: 2
            });

            const errors = node.validate({ a: "1", b: "2" });

            assert.equal(errors.length, 0);
        });
    });
});

describe("faeture : object : getTemplate", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should return default value of properties", () => {
        const node = compileSchema(draft, {
            type: "object",
            properties: {
                header: { type: "string", default: "title" }
            }
        });

        const data = node.getTemplate();

        assert.deepEqual(data, { header: "title" });
    });
});
