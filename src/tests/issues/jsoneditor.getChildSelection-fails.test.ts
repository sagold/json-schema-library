import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draftEditor } from "../../draftEditor";
import { SchemaNode } from "../../SchemaNode";

describe("issue#22 - resolve nested oneOfs and refs", () => {
    let root: SchemaNode;
    beforeEach(() => {
        root = compileSchema(
            {
                type: "object",
                required: ["pageContents"],
                properties: {
                    pageContents: {
                        title: "Page",
                        type: "array",
                        options: {
                            classNames: ["scm-page-contents"],
                            sortable: {
                                enabled: true
                            }
                        },
                        items: {
                            oneOfProperty: "type",
                            oneOf: [{ $ref: "#/$defs/layout-column-one" }, { $ref: "#/$defs/layout-column-two" }]
                        }
                    },
                    footer: {
                        $ref: "#/$defs/component:footer"
                    }
                },
                $defs: {
                    "layout-column-two": {
                        title: "two column layout",
                        type: "object",
                        required: ["type", "children"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "layout:column-two"
                            },
                            children: {
                                type: "array",
                                options: { classNames: [".scm-two-columns"] },
                                prefixItems: [
                                    {
                                        $ref: "#/$defs/layout-column-one",
                                        options: {
                                            classNames: [".scm-column"]
                                        }
                                    },
                                    {
                                        $ref: "#/$defs/layout-column-one",
                                        options: {
                                            classNames: [".scm-column"]
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    "layout-column-one": {
                        type: "object",
                        title: "single column layout",
                        required: ["type", "children"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "layout:column-one"
                            },
                            children: {
                                type: "array",
                                uniqueItems: true,
                                options: {
                                    sortable: {
                                        enabled: true
                                    }
                                },
                                items: {
                                    oneOfProperty: "type",
                                    oneOf: [
                                        { $ref: "#/$defs/component:cta" },
                                        { $ref: "#/$defs/component:product-list" },
                                        { $ref: "#/$defs/component:address" }
                                    ]
                                }
                            }
                        }
                    },
                    "component:cta": {
                        type: "object",
                        title: "CTA",
                        required: ["type"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "module:cta"
                            }
                        }
                    },
                    "component:product-list": {
                        type: "object",
                        title: "Product List",
                        required: ["type"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "module:product-list"
                            }
                        }
                    },
                    "component:address": {
                        type: "object",
                        title: "Address",
                        required: ["type"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "module:address"
                            }
                        }
                    },
                    "component:footer": {
                        type: "object",
                        title: "Footer",
                        required: ["type", "withLogo"],
                        properties: {
                            type: {
                                options: { hidden: true },
                                type: "string",
                                const: "module:footer"
                            },
                            withLogo: {
                                type: "boolean"
                            }
                        }
                    }
                }
            },
            { drafts: [draftEditor] }
        );
    });

    it("should resolve and reduce first $ref", () => {
        const { node: columns, error } = root.getNode("#/pageContents/0", {
            pageContents: [{ type: "layout:column-two", children: [] }]
        });
        if (error) console.log("error", error);
        assert(columns);

        assert.deepEqual(
            columns?.schema,
            root.schema.$defs["layout-column-two"],
            "should match $defs['layout-column-two']"
        );
    });

    it("should return parsed node for property of first $ref", () => {
        const { node: children, error } = root.getNode("#/pageContents/0/children", {
            pageContents: [{ type: "layout:column-two", children: [] }]
        });
        if (error) console.log("error", error);
        assert(children);

        assert.deepEqual(children?.schema, root.schema.$defs["layout-column-two"].properties.children);
        assert.deepEqual(children?.prefixItems?.length, 2);
    });

    it("should resolve and reduce nested $ref", () => {
        const { node: firstColumn } = root.getNode("#/pageContents/0/children/0", {
            pageContents: [
                {
                    type: "layout:column-two",
                    children: [{ type: "layout:column-one", children: [] }]
                }
            ]
        });
        assert(firstColumn);

        assert.deepEqual(
            firstColumn?.schema,
            {
                // options on ref-node should have been merged
                options: { classNames: [".scm-column"] },
                ...root.schema.$defs["layout-column-one"]
            },
            "should match $defs['layout-column-one']"
        );
    });
});
