const { expect } = require("chai");
const JsonEditor = require("../../lib/cores/JsonEditor");
const Draft04 = require("../../lib/cores/Draft04");
const compile = require("../../lib/compile");
const remotes = require("../../remotes");


describe("benchmark spec tests", () => {

    // this is wanted fuzzy behaviour and collision on validation...
    it.skip("should correctly validate complex oneOf type", () => {
        const core = new JsonEditor({
            oneOf: [
                {
                    properties: {
                        bar: { type: "integer" }
                    },
                    required: ["bar"]
                },
                {
                    properties: {
                        foo: { type: "string" }
                    },
                    required: ["foo"]
                }
            ]
        });
        const errors = core.validate({ foo: "baz", bar: 2 });
        console.log("errors", JSON.stringify(errors));
        expect(errors.length).to.eq(1, "both oneOf valid (complex)");
    });

    // this fails in benchmark...
    it("should invalidate wrong schema for remote schema", () => {
        // remotes["http://json-schema.org/draft-04/schema"] = compile(require("../../remotes/draft04.json"));
        const core = new Draft04({ $ref: "http://json-schema.org/draft-04/schema#" });

        const isValid = core.isValid({
            definitions: {
                foo: { type: 1 }
            }
        });

        expect(isValid).to.eq(false, "data should not be valid");
    });

    it("should correctly validate remote schema", () => {
        const core = new Draft04({ $ref: "http://json-schema.org/draft-04/schema#" });

        const isValid = core.isValid({
            definitions: {
                foo: { type: "integer" }
            }
        });

        expect(isValid).to.eq(true, "data should be valid");
    });

    it("should correctly validate recursive references between schemas", () => {
        const schema = {
            id: "http://localhost:1234/tree",
            description: "tree of nodes",
            type: "object",
            properties: {
                meta: { type: "string" },
                nodes: {
                    type: "array",
                    items: { $ref: "node" }
                }
            },
            required: ["meta", "nodes"],
            definitions: {
                node: {
                    id: "http://localhost:1234/node",
                    description: "node",
                    type: "object",
                    properties: {
                        value: { type: "number" },
                        subtree: { $ref: "tree" }
                    },
                    required: ["value"]
                }
            }
        };
        const core = new Draft04(schema);

        const errors = core.validate({
            meta: "root",
            nodes: [
                {
                    value: 1,
                    subtree: {
                        meta: "child",
                        nodes: [
                            { value: "string is invalid" },
                            { value: 1.2 }
                        ]
                    }
                }
            ]
        });

        expect(errors.length).to.eq(1);
    });

    it("should resolve base URI change base URI change ref valid", () => {
        remotes["http://localhost:1234/folder/folderInteger.json"] = compile(
            require("json-schema-test-suite/remotes/folder/folderInteger.json")
        );
        const core = new Draft04({
            id: "http://localhost:1234/",
            items: {
                id: "folder/",
                items: { $ref: "folderInteger.json" }
            }
        });

        const errors = core.validate([[1]]);
        // console.log(JSON.stringify(errors, null, 2));
        expect(errors.length).to.eq(0);
    });
});
