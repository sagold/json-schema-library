import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : uniqueItems : validate", () => {
    it("should detect duplicates with object-valued constructor members", () => {
        const node = compileSchema({ uniqueItems: true });
        const { valid, errors } = node.validate([{ constructor: { a: 1, b: 2 } }, { constructor: { b: 2, a: 1 } }]);

        assert.equal(valid, false);
        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "unique-items-error");
        assert.equal(errors[0].data.duplicatePointer, "#/0");
    });
});
