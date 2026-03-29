import { strict as assert } from "assert";
import { compileSchema } from "../compileSchema";
import { draft2020 } from "../draft2020";
import { extendDraft } from "../Draft";
import { propertyDependenciesKeyword } from "./propertyDependencies";
import { isSchemaNode } from "../SchemaNode";

const drafts = [
    extendDraft(draft2020, {
        keywords: [propertyDependenciesKeyword]
    })
];

describe("keyword : propertyDependencies : validate", () => {
    it("should return error if schema at matching property+value is invalid", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    propertyDependencies: {
                        propertyName: {
                            propertyValue: {
                                $ref: "#/$defs/object"
                            }
                        }
                    }
                },
                $defs: {
                    object: {
                        type: "object",
                        required: ["propertyName", "test"],
                        properties: {
                            propertyName: { type: "string" },
                            test: { type: "string" }
                        }
                    }
                }
            },
            { drafts }
        );
        const { errors } = node.validate([{ propertyName: "propertyValue", test: 123 }]);
        assert.equal(errors.length, 1);
    });

    it("should return all errors for schemata at matching property+value", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    propertyDependencies: {
                        propertyName: {
                            propertyValue: {
                                $ref: "#/$defs/object"
                            }
                        },
                        type: {
                            headline: {
                                $ref: "#/$defs/object"
                            }
                        }
                    }
                },
                $defs: {
                    object: {
                        type: "object",
                        required: ["propertyName", "type", "test"],
                        properties: {
                            propertyName: { type: "string" },
                            type: { type: "string" },
                            test: { type: "number" }
                        }
                    }
                }
            },
            { drafts }
        );
        const { errors } = node.validate([{ propertyName: "propertyValue", type: "headline", test: "123" }]);
        assert.equal(errors.length, 2);
    });

    it("should be valid for valid schema matching property+value", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    propertyDependencies: {
                        propertyName: {
                            propertyValue: {
                                $ref: "#/$defs/object"
                            }
                        }
                    }
                },
                $defs: {
                    object: {
                        type: "object",
                        required: ["propertyName", "type", "test"],
                        properties: {
                            propertyName: { type: "string" },
                            type: { type: "string" },
                            test: { type: "number" }
                        }
                    }
                }
            },
            { drafts }
        );
        const { errors } = node.validate([{ propertyName: "propertyValue", type: "headline", test: 123 }]);
        assert.equal(errors.length, 0);
    });

    it("should be valid for valid schema matching property+number", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    propertyDependencies: {
                        test: {
                            "123": {
                                $ref: "#/$defs/object"
                            }
                        }
                    }
                },
                $defs: {
                    object: {
                        type: "object",
                        required: ["propertyName", "type", "test"],
                        properties: {
                            propertyName: { type: "string" },
                            type: { type: "string" },
                            test: { type: "number" }
                        }
                    }
                }
            },
            { drafts }
        );
        const { errors } = node.validate([{ propertyName: "propertyValue", type: "headline", test: 123 }]);
        assert.equal(errors.length, 0);
    });
});

describe("keyword : propertyDependencies : validate", () => {
    it("should return reduced schema of matching property+value", () => {
        const node = compileSchema(
            {
                type: "array",
                items: {
                    properties: {
                        id: { type: "string" }
                    },
                    propertyDependencies: {
                        propertyName: {
                            propertyValue: {
                                $ref: "#/$defs/object"
                            }
                        }
                    }
                },
                $defs: {
                    object: {
                        type: "object",
                        required: ["propertyName", "test"],
                        properties: {
                            propertyName: { type: "string" },
                            test: { type: "string" }
                        }
                    }
                }
            },
            { drafts }
        );
        const reducedNode = node.getNode("#/0", [{ propertyName: "propertyValue", test: 123 }])?.node;
        assert(isSchemaNode(reducedNode));
        assert(reducedNode.schema.propertyDependencies == null);
        assert(reducedNode.schema.properties.id);
        assert(reducedNode.schema.properties.propertyName);
    });
});
