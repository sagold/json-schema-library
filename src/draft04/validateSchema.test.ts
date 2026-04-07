import { compileSchema as _compileSchema, type CompileOptions } from "../compileSchema";
import { strict as assert } from "assert";
import { draft04 } from "../draft04";
import { JsonSchema } from "../types";

const drafts = [draft04];
function compileSchema(schema: JsonSchema, options: CompileOptions = {}) {
    return _compileSchema(schema, { ...options, drafts });
}

describe("validateSchema (4)", () => {
    it("should error if `exclusiveMinimum` is not a number or boolean", () => {
        const { schemaErrors } = compileSchema({ exclusiveMinimum: [] });
        assert.equal(schemaErrors?.length, 1);
    });
    it("should error if `exclusiveMaximum` is not a number or boolean", () => {
        const { schemaErrors } = compileSchema({ exclusiveMaximum: [] });
        assert.equal(schemaErrors?.length, 1);
    });
});
