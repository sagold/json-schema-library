import { expect } from "chai";
import { Draft2019 } from "../../lib/draft2019"
import { JsonSchema } from "../../lib/types";

describe("recursiveRef", () => {

    describe("properties", () => {
        let inputSchema: JsonSchema = {};
        beforeEach(() => (inputSchema = {
            type: "object",
            testId: "root",
            properties: {
                parent: {
                    $recursiveAnchor: true,
                    type: "object",
                    testId: "parent",
                    properties: {
                        foo: {
                            testId: "child",
                            $recursiveRef: "#"
                        }
                    }
                }
            }
        }));

        it("should return correct reference using step", () => {
            const draft = new Draft2019(inputSchema);
            const schema = draft.getSchema(); // compiled schema
            const schemaParent = draft.step("parent", schema, { parent: { foo: { foo: 12 } } }, schema.__scope.pointer);
            const foo1 = draft.step("foo", schemaParent, { foo: { foo: 12 } }, schemaParent.__scope.pointer);
            const foo2 = draft.step("foo", foo1, { foo: 12 }, foo1.__scope.pointer);

            expect(foo2.type).to.eq("object");
            expect(foo2.testId).to.eq("parent");
        });

        it("should return correct reference using getSchema", () => {
            const draft = new Draft2019(inputSchema);
            const schema = draft.getSchema({ pointer: "#/parent/foo/foo", data: { parent: { foo: { foo: 12 } } } });

            expect(schema.type).to.eq("object");
            expect(schema.testId).to.eq("parent");
        });
    });
});
