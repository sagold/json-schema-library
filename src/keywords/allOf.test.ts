import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : allOf : get", () => {
    it("should step into allOf-property", () => {
        const node = compileSchema({
            type: "object",
            allOf: [{ properties: { header: { type: "string", minLength: 1 } } }]
        });

        const schema = node.getNodeChild("header", { withHeader: true, header: "huhu" })?.node?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should recursively resolve allOf schema", () => {
        const node = compileSchema({
            type: "object",
            allOf: [
                {
                    if: { required: ["withHeader"], properties: { withHeader: { const: true } } },
                    then: { required: ["header"], properties: { header: { type: "string", minLength: 1 } } }
                }
            ]
        });

        const schema = node.getNodeChild("header", { withHeader: true, header: "huhu" })?.node?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });
});
