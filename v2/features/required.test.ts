import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : properties : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("shoud return errors for missing `required` properties", () => {
        const errors = compileSchema(draft, {
            type: "object",
            required: ["id", "a", "aa", "aaa"]
        }).validate({ id: "first", a: "correct", b: "ignored" });

        assert.deepEqual(errors.length, 2);
        assert.deepEqual(errors[0].code, "required-property-error");
        assert.deepEqual(errors[1].code, "required-property-error");
    });
});
