import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("issue#138 - reducing nodes should not update context refs", () => {
    it("reduceNode should not replace node context.refs", () => {
        const root = compileSchema(
            {
                $schema: "http://json-schema.org/draft-07/schema#",
                $id: "https://example.test/tree",
                type: "object",
                properties: {
                    enabled: { type: "boolean" },
                    child: { $ref: "#" }
                },
                if: { required: ["enabled"] },
                then: { required: ["name"] }
            },
            { draft: "draft-7" }
        );

        const rootRef = root.context.refs["https://example.test/tree"];
        root.reduceNode({ enabled: true });
        const rootRefAfter = root.context.refs["https://example.test/tree"];

        assert(rootRef === rootRefAfter);
    });
});
