import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { draftEditor } from "./draftEditor";
import { SchemaNode } from "./SchemaNode";
import { draft04 } from "./draft04";
import { draft07 } from "./draft07";
import { draft2020 } from "./draft2020";

describe("compileSchema vocabulary", () => {
    let root: SchemaNode;
    beforeEach(
        () =>
            (root = compileSchema({
                type: "object",
                additionalProperties: false,
                properties: {
                    image: {
                        type: "object",
                        properties: {
                            title: { name: "title", type: "string" }
                        }
                    }
                }
            }))
    );

    it("should return rootNode from rootNode", () => {
        const node = root.getNodeRoot();
        assert(node === root);
    });

    it("should return rootNode from childNode", () => {
        const { node } = root.getNode("/image/title");
        assert(node);
        assert(node.getNodeRoot() === root);
    });
});

describe("compileSchema draft-version", () => {
    it("should select last draft", () => {
        const node = compileSchema({}, { drafts: [draft04, draft07, draft2020] });
        assert(node.getDraftVersion(), "draft-2020");
    });

    it("should select draft specified by $schema", () => {
        const node = compileSchema(
            { $schema: "http://json-schema.org/draft-07/schema#" },
            { drafts: [draft04, draft07, draft2020] }
        );
        assert(node.getDraftVersion(), "draft-07");
    });

    it("should select fallback draft specified by `draft`", () => {
        const node = compileSchema(
            {},
            {
                draft: "http://json-schema.org/draft-07/schema#",
                drafts: [draft04, draft07, draft2020]
            }
        );
        assert(node.getDraftVersion(), "draft-07");
    });

    it("should prefer `$schema` over `draft` options", () => {
        const node = compileSchema(
            { $schema: "http://json-schema.org/draft-04/schema#" },
            {
                draft: "http://json-schema.org/draft-07/schema#",
                drafts: [draft04, draft07, draft2020]
            }
        );
        assert(node.getDraftVersion(), "draft-04");
    });

    it("should always fallback to last draft if nothing matches", () => {
        const node = compileSchema(
            { $schema: "http://json-schema.org/draft-A/schema#" },
            {
                draft: "http://json-schema.org/draft-B/schema#",
                drafts: [draft04, draft07, draft2020]
            }
        );
        assert(node.getDraftVersion(), "draft-2020");
    });
});

describe("compileSchema vocabulary", () => {
    it("should add remote schema on compile", () => {
        const remote = compileSchema({
            $id: "https://remote/schema",
            minLength: 10
        });
        const node = compileSchema({ $ref: "https://remote/schema" }, { remote, formatAssertion: "meta-schema" });

        const { errors } = node.validate("123");

        assert.deepEqual(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-error");
    });

    it("should NOT validate formats when $vocabulary.format-assertion = false", () => {
        const remote = compileSchema({
            $id: "https://remote/schema",
            $vocabulary: {
                "https://json-schema.org/draft/2020-12/vocab/format-assertion": false
            },
            allOf: [{ $ref: "https://json-schema.org/draft/2020-12/vocab/format-assertion" }]
        });
        const node = compileSchema(
            { $schema: "https://remote/schema", format: "date-time" },
            { remote, formatAssertion: "meta-schema" }
        );

        const { errors } = node.validate("123");

        assert.deepEqual(errors.length, 0);
    });

    it("should validate formats when $vocabulary.format-assertion = true", () => {
        const remote = compileSchema({
            $id: "https://remote/schema",
            $vocabulary: {
                "https://json-schema.org/draft/2020-12/vocab/format-assertion": true
            },
            allOf: [{ $ref: "https://json-schema.org/draft/2020-12/vocab/format-assertion" }]
        });
        const node = compileSchema(
            { $schema: "https://remote/schema", format: "date-time" },
            { remote, formatAssertion: "meta-schema" }
        );

        const { errors } = node.validate("123");

        assert.deepEqual(errors.length, 1);
    });
});

describe("compileSchema getDataDefaultOptions", () => {
    it("should apply `getDataDefaultOptions.addOptionalProps` to getData", () => {
        const schema = {
            properties: {
                type: { const: "node" },
                nodes: { items: { $ref: "#" } }
            }
        };

        let data = compileSchema(schema).getData();
        assert.deepEqual(data, {});

        data = compileSchema(schema, { getDataDefaultOptions: { addOptionalProps: true } }).getData();
        assert.deepEqual(data, {
            type: "node",
            nodes: []
        });
    });

    it("should apply `getDataDefaultOptions.recursiveLimit` to getData", () => {
        const schema = {
            required: ["type", "nodes"],
            properties: {
                type: { const: "node" },
                nodes: { items: { $ref: "#" }, minItems: 1 }
            }
        };

        let data = compileSchema(schema).getData();
        assert.deepEqual(data, {
            type: "node",
            nodes: [
                {
                    type: "node",
                    nodes: []
                }
            ]
        });

        data = compileSchema(schema, { getDataDefaultOptions: { recursionLimit: 2 } }).getData();
        assert.deepEqual(data, {
            type: "node",
            nodes: [
                {
                    type: "node",
                    nodes: [
                        {
                            type: "node",
                            nodes: []
                        }
                    ]
                }
            ]
        });
    });
});

describe("compileSchema `schemaLocation`", () => {
    it("should store path from rootSchema as schemaLocation", () => {
        const node = compileSchema({
            if: { type: "string" },
            then: { type: "string" },
            properties: { title: { type: "string" } },
            $defs: { asset: { type: "string" } }
        });

        assert(node.if && node.then && node.properties && node.$defs);
        assert.deepEqual(node.schemaLocation, "#");
        assert.deepEqual(node.if.schemaLocation, "#/if");
        assert.deepEqual(node.then.schemaLocation, "#/then");
        assert.deepEqual(node.properties.title.schemaLocation, "#/properties/title");
        assert.deepEqual(node.$defs.asset.schemaLocation, "#/$defs/asset");
    });

    it("should maintain schemaLocation when resolved by ref", () => {
        const { node } = compileSchema({
            properties: { title: { $ref: "#/$defs/asset" } },
            $defs: { asset: { type: "string" } }
        }).getNodeChild("title");

        assert.deepEqual(node?.schemaLocation, "#/$defs/asset");
    });

    it("should maintain schemaLocation when resolved by root-ref", () => {
        const { node } = compileSchema({
            properties: { title: { $ref: "#" } }
        }).getNodeChild("title");

        assert.deepEqual(node?.schemaLocation, "#");
    });
});

describe("compileSchema `errors`", () => {
    it("draftEditor come with custom minLengthOneError", () => {
        const { errors } = compileSchema(
            {
                type: "string",
                minLength: 1
            },
            { drafts: [draftEditor] }
        ).validate("");
        assert.equal(errors.length, 1);
        assert.deepEqual(errors[0].code, "min-length-one-error");
    });
});
