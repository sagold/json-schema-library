import { expect } from "chai";
import { Draft07 as Draft } from "../../../lib/draft07";

describe.only("issue#38 - getTemplate anyOf should not modify valid default value", () => {
    let draft: Draft;
    beforeEach(() => {
        draft = new Draft({
            type: "object",
            required: ["someList"],
            properties: {
                someList: {
                    type: "array",
                    items: { anyOf: [{ a: "number" }, { b: "string" }, { c: { const: "foo" } }] },
                    minItems: 3,
                    default: [{ a: 1 }, { b: "schfifty-five" }, { c: "foo" }]
                }
            }
        });
    });

    it("should return valid default value", () => {
        const result = draft.getTemplate();

        expect(result).to.deep.equal({
            someList: [{ a: 1 }, { b: "schfifty-five" }, { c: "foo" }]
        });
    });
});
