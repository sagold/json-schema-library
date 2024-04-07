import { expect } from "chai";
import { Draft2019 } from "../../lib/draft2019"

describe.only("recursiveRef", () => {

    it("should return correct reference", () => {
        const inputSchema = {
            type: "object",
            properties: {
                parent: {
                    // $recursiveAnchor: true,
                    type: "object",
                    properties: {
                        foo: {
                            $recursiveRef: "#"
                        }
                    }
                }
            }
        };

        const draft = new Draft2019(inputSchema);
        const schema = draft.getSchema(); // compiled schema
        console.log("root", schema.__scope);

        const schemaParent = draft.step("parent", schema, { parent: { foo: { foo: 12 } } }, schema.__scope.pointer);
        console.log("parent", schemaParent.__scope);

        const foo1 = draft.step("foo", schemaParent, { foo: { foo: 12 } }, schemaParent.__scope.pointer);
        console.log("foo1", foo1.__scope);

        const foo2 = draft.step("foo", foo1, { foo: 12 }, foo1.__scope.pointer);
        console.log("foo2", foo2.__scope);
    });
});
