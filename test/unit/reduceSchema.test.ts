import { strict as assert } from "assert";
import { Draft07 as Draft } from "../../lib/draft07";
import { reduceSchema } from "../../lib/reduceSchema";

describe("reduceSchema", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft()));

    describe("oneOf", () => {
        it("should return oneOf source schema for resolved oneOf object", () => {
            const staticSchema = reduceSchema(
                draft,
                {
                    type: "object",
                    oneOfProperty: "type",
                    oneOf: [
                        {
                            type: "object",
                            required: ["type", "title"],
                            properties: {
                                type: { type: "string", const: "paragraph" },
                                title: { type: "string", title: "paragprah title" }
                            }
                        },
                        {
                            type: "object",
                            required: ["type", "title"],
                            properties: {
                                type: { type: "string", const: "section" },
                                title: { type: "string", title: "section title" }
                            }
                        }
                    ]
                },
                { type: "section", title: "" }
            );

            assert.equal(typeof staticSchema.getOneOfOrigin, "function");
            // @ts-ignore
            assert.equal(staticSchema.getOneOfOrigin().index, 1);
        });
    });
});
