import { compileSchema } from "./compileSchema";
import { strict as assert } from "assert";
import { isSchemaNode, SchemaNode } from "./SchemaNode";
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

describe("compileSchema remotes", () => {
    it("should add list of remotes to returned SchemaNode node", () => {
        const node = compileSchema(
            {
                type: "object",
                required: ["string", "number"],
                properties: {
                    string: { $ref: "https://remote-a.com/schema" },
                    number: { $ref: "https://remote-b.com/schema" }
                }
            },
            {
                drafts: [draft2020],
                remotes: [
                    { $id: "https://remote-a.com/schema", type: "string", default: "a" },
                    { $id: "https://remote-b.com/schema", type: "number", default: 9 }
                ]
            }
        );
        const data = node.getData();
        assert.deepEqual(data, { string: "a", number: 9 });
    });

    it("should resolve definition of remote schema", () => {
        const node = compileSchema(
            {
                type: "object",
                required: ["value"],
                properties: {
                    value: { $ref: "https://remote.com/definitions.json#/$defs/property" }
                }
            },
            {
                drafts: [draft2020],
                remotes: [
                    {
                        $id: "https://remote.com/definitions.json",
                        $defs: {
                            property: {
                                title: "remote boolean definition",
                                type: "boolean"
                            }
                        }
                    }
                ]
            }
        );

        const data = node.getData();
        assert.deepEqual(data, { value: false });

        const { node: valueNode } = node.getNode("#/value");
        assert(isSchemaNode(valueNode), "expected returned node to be a valid SchemaNode");
        assert.deepEqual(valueNode.schema, {
            title: "remote boolean definition",
            type: "boolean"
        });
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

describe("compileSchema formatAssertion", () => {
    it("should skip remote format assertions when disabled", () => {
        const node = compileSchema({ $ref: "https://remote/email" }, { formatAssertion: false }).addRemoteSchema(
            "https://remote/email",
            { type: "string", format: "email" }
        );

        assert.equal(node.validate("not-an-email").valid, true);
        assert.deepEqual(
            node.validate(42).errors.map((error) => error.code),
            ["type-error"]
        );
    });

    it("should assert remote formats by default", () => {
        const node = compileSchema({ $ref: "https://remote/email" }).addRemoteSchema("https://remote/email", {
            type: "string",
            format: "email"
        });

        assert.deepEqual(
            node.validate("not-an-email").errors.map((error) => error.code),
            ["format-email-error"]
        );
    });

    it("should skip format assertions for the first and later remotes option entries", () => {
        const node = compileSchema(
            {
                type: "array",
                prefixItems: [{ $ref: "https://remote/first" }, { $ref: "https://remote/later" }]
            },
            {
                formatAssertion: false,
                remotes: [
                    { $id: "https://remote/first", type: "string", format: "email" },
                    { $id: "https://remote/later", type: "string", format: "email" }
                ]
            }
        );

        assert.deepEqual(node.validate(["not-an-email", "not-an-email"]).errors, []);
    });

    it("should preserve disabled assertions through transitive remote registration", () => {
        const node = compileSchema({ $ref: "https://remote/wrapper" }, { formatAssertion: false }).addRemoteSchema(
            "https://remote/wrapper",
            { $ref: "https://remote/email" }
        );
        const remote = node.getNodeRef("https://remote/wrapper");
        assert(remote);
        remote.addRemoteSchema("https://remote/email", { type: "string", format: "email" });

        assert.equal(node.validate("not-an-email").valid, true);
    });

    it("should still report and throw for malformed formats when assertions are disabled", () => {
        const { schemaErrors, schemaAnnotations } = compileSchema({ format: 0 }, { formatAssertion: false });

        assert.deepEqual(
            schemaErrors?.map((error) => error.code),
            ["schema-error"]
        );
        assert.deepEqual(schemaAnnotations, []);
        assert.throws(
            () => compileSchema({ format: 0 }, { formatAssertion: false, throwOnInvalidSchema: true }),
            /Invalid schema passed to compileSchema/
        );
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
