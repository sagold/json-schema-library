import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { ValidationPath } from "./Keyword";

describe("validate - path", () => {
    it("should preserve the caller's scope across conditional and allOf validation", () => {
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

        const path: ValidationPath = [{ pointer: "#", node: compileSchema({}) }];
        const incomingScope = [...path];
        const result = node.validate(
            {
                withHeader: true,
                date: "2013-13-13"
            },
            "#",
            path
        );
        assert.equal(result.valid, false);
        assert.deepEqual(result.errors.map(({ code }) => code), ["required-property-error"]);
        assert.equal(path.length, incomingScope.length);
        assert.equal(path[0], incomingScope[0]);
    });
});
