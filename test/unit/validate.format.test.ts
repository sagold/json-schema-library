import { strict as assert } from "assert";
import _validate from "../../lib/validate";
import { Draft04 } from "../../lib/draft04";
import { JsonSchema, createNode } from "../../lib/types";
import { Draft } from "../../lib/draft";

function validate(draft: Draft, value: unknown, schema: JsonSchema = draft.getSchema() as JsonSchema) {
    return _validate(createNode(draft, schema), value);
}

describe("validate format", () => {
    let draft: Draft04;
    before(() => (draft = new Draft04()));

    describe("time", () => {
        it("should validate HH:mm:ss", () => {
            const errors = validate(draft, "15:31:12", {
                type: "string",
                format: "time"
            });
            assert.deepEqual(errors, []);
        });

        it("should validate HH:mm:ss.s", () => {
            const errors = validate(draft, "15:31:12.99", {
                type: "string",
                format: "time"
            });
            assert.deepEqual(errors, []);
        });

        it("should validate HH:mm:ss-HH:mm", () => {
            const errors = validate(draft, "15:31:12-02:30", {
                type: "string",
                format: "time"
            });
            assert.deepEqual(errors, []);
        });

        it("should validate HH:mm:ssZ", () => {
            const errors = validate(draft, "15:31:12Z", {
                type: "string",
                format: "time"
            });
            assert.deepEqual(errors, []);
        });

        it("should not validate minutes above 59", () => {
            const errors = validate(draft, "15:60:12", {
                type: "string",
                format: "time"
            });
            assert.equal(errors.length, 1);
        });

        it("should not validate seconds above 59", () => {
            const errors = validate(draft, "15:31:60", {
                type: "string",
                format: "time"
            });
            assert.equal(errors.length, 1);
        });

        it("should not validate HH:mm", () => {
            const errors = validate(draft, "15:31", {
                type: "string",
                format: "time"
            });
            assert.equal(errors.length, 1);
        });
    });

    describe("url", () => {
        it("should validate format url", () => {
            const errors = validate(draft, "https://developer.mozilla.org/en-US/", {
                type: "string",
                format: "url"
            });
            assert.deepEqual(errors, []);
        });

        it("should return error UrlFormatError for invalid urls", () => {
            const errors = validate(draft, "123", {
                type: "string",
                format: "url"
            });
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "format-urlerror");
        });
    });
});
