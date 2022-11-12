import { expect } from "chai";
import settings from "../../../lib/config/settings";
import { Draft07 } from "../../../lib/draft07";

const INITIAL_RECURSION = settings.GET_TEMPLATE_RECURSION_LIMIT;

describe.only("issue#19 - getSchema from dependencies", () => {
    let core: Draft07;
    beforeEach(() => {
        settings.GET_TEMPLATE_RECURSION_LIMIT = 2;
        core = new Draft07({
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
                    items: [
                        {
                            $ref: "#/definitions/job"
                        }
                    ]
                }
            }
        });
    });

    afterEach(() => {
        settings.GET_TEMPLATE_RECURSION_LIMIT = INITIAL_RECURSION;
    });

    it("should return correct schema for existing data property 'customField'", () => {
        const data = core.getTemplate({
            jobs: [{ name: "job-1" }, { name: "job-2" }]
        });

        expect(data).to.deep.equal({
            jobs: [
                { name: "job-1", runner: { cluster: "cluster-a" } },
                { name: "job-2", runner: { cluster: "cluster-a" } }
            ]
        });
    });
});
