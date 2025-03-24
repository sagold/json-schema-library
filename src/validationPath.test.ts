import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { ValidationPath } from "./types";

describe("validate - path", () => {
    it("should should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema({
            type: "object",
            properties: { withHeader: { type: "boolean" } },
            if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
            then: {
                required: ["header"],
                properties: { header: { type: "string", minLength: 1 } }
            },
            allOf: [{ required: ["date"], properties: { date: { type: "string" } } }]
        });

        const path: ValidationPath = [];
        node.validate(
            {
                withHeader: true,
                date: "2013-13-13"
            },
            "#",
            path
        );

        console.log(path.map((v) => ({ ptr: v.pointer, sptr: v.node.spointer })));

        assert(path.length > 0);
    });
});
