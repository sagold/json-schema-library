import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { SchemaNode } from "../../types";

describe("issue#21 - getTemplate containing refs", () => {
    let node: SchemaNode;
    beforeEach(() => {
        node = compileSchema({
            $schema: "http://json-schema.org/draft/2019-09/schema",
            type: "object",
            additionalProperties: false,
            required: ["jobs"],
            properties: {
                jobs: {
                    $ref: "#/definitions/jobs"
                }
            },
            definitions: {
                cluster: {
                    type: "string",
                    enum: ["cluster-a", "cluster-b"],
                    default: "cluster-a"
                },
                runner: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        cluster: {
                            $ref: "#/definitions/cluster"
                        }
                    },
                    required: ["cluster"]
                },
                job: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                        name: {
                            type: "string"
                        },
                        runner: {
                            $ref: "#/definitions/runner"
                        }
                    },
                    required: ["name", "runner"]
                },
                jobs: {
                    type: "array",
                    items: {
                        $ref: "#/definitions/job"
                    }
                }
            }
        });
    });

    it("should append property 'runner' on partial objects", () => {
        const data = node.getTemplate(
            {
                jobs: [{ name: "job-1" }, { name: "job-2" }, { name: "job-3" }]
            },
            { recursionLimit: 1 }
        );

        assert.deepEqual(data, {
            jobs: [
                { name: "job-1", runner: { cluster: "cluster-a" } },
                { name: "job-2", runner: { cluster: "cluster-a" } },
                { name: "job-3", runner: { cluster: "cluster-a" } }
            ]
        });
    });
});
