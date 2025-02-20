import { strict as assert } from "assert";
import { Draft2019 } from "../../lib/draft2019";
import { Draft } from "../../lib/draft";
import { compileSchema } from "../compileSchema";

describe("feature : patternProperties : get", () => {
    let draft: Draft;
    beforeEach(() => (draft = new Draft2019()));

    it("should step into patternProperties", () => {
        const node = compileSchema(draft, {
            type: "object",
            patternProperties: {
                "[0-9][0-9]7": { type: "string", minLength: 1 }
            }
        });

        const schema = node.get("007")?.schema;

        assert.deepEqual(schema, { type: "string", minLength: 1 });
    });

    it("should NOT step into patternProperties", () => {
        const node = compileSchema(draft, {
            type: "object",
            patternProperties: {
                "[0-9][0-9]7": { type: "string", minLength: 1 }
            }
        });

        const schema = node.get("[0-9][0-9]7")?.schema;

        assert.deepEqual(schema, undefined);
    });
});
