import { strict as assert } from "assert";
import { expect } from "chai";
import { Draft2019 } from "../../lib/draft2019"
import { JsonSchema, isJsonError } from "../../lib/types";
import { isSchemaNode } from "../../lib/schemaNode";

describe.skip("recursiveRef", () => {

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
            const schema = draft.rootSchema; // compiled schema

            const schemaParent = draft.step("parent", schema, { parent: { foo: { foo: 12 } } }, schema.__scope.pointer);
            assert(isSchemaNode(schemaParent));
            const foo1 = draft.step("foo", schemaParent, { foo: { foo: 12 } }, schemaParent.schema.__scope.pointer).schema;
            assert(isSchemaNode(foo1));
            const foo2 = draft.step("foo", foo1, { foo: 12 }, foo1.schema.__scope.pointer).schema;
            assert(isSchemaNode(foo2));

            expect(foo2.schema.type).to.eq("object");
            expect(foo2.schema.testId).to.eq("parent");
        });

        it("should return correct reference using getSchema", () => {
            const draft = new Draft2019(inputSchema);
            const schema = draft.getSchema({ pointer: "#/parent/foo/foo", data: { parent: { foo: { foo: 12 } } } });

            assert(schema != null);
            assert(!isJsonError(schema));

            expect(schema.type).to.eq("object");
            expect(schema.testId).to.eq("parent");
        });
    });
});
