import { strict as assert } from "assert";
import validate from "../../lib/validate";
import { Draft04 } from "../../lib/draft04";

describe("validate format", () => {
    let draft: Draft04;
    before(() => (draft = new Draft04()));

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
