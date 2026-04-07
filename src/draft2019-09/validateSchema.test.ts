import { compileSchema as _compileSchema, type CompileOptions } from "../compileSchema";
import { strict as assert } from "assert";
import { draft2019 } from "../draft2019";
import { JsonSchema } from "../types";

const drafts = [draft2019];
function compileSchema(schema: JsonSchema, options: CompileOptions = {}) {
    return _compileSchema(schema, { ...options, drafts });
}

describe("validateSchema (2019-09)", () => {
    it("should error if `additionalItems` is of an invalid type", () => {
        const { schemaErrors } = compileSchema({ additionalItems: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should create annotation for `additionalItems` where items-array is missing", () => {
        const { schemaAnnotations } = compileSchema({ additionalItems: true });
        assert.equal(schemaAnnotations?.length, 1);
    });
    it("should error if `items` is of an invalid type", () => {
        const { schemaErrors } = compileSchema({ items: 999 });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `unevaluatedItems` is not an object or boolean", () => {
        const { schemaErrors } = compileSchema({ unevaluatedItems: [] });
        assert.equal(schemaErrors?.length, 1);
    });
});
