import { compileSchema } from "./compileSchema";
import { Draft } from "../lib/draft";
import { Draft2019 } from "../lib/draft2019";
import { strict as assert } from "assert";
import { ValidationPath } from "./compiler/types";

describe("validate - path", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it.only("should should resolve both if-then-else and allOf schema", () => {
        const node = compileSchema(draft, {
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
