import { strict as assert } from "node:assert";
import { compileSchema } from "../src/compileSchema";
import { remotes } from "json-schema-library/remotes";
import { JsonSchema } from "../src/types";
import { runCommand } from "./bowtie";
import { ErrorResponse, RunCmdResponse } from "./bowtie-api";

const isRunCmdResponse = (value: unknown): value is RunCmdResponse =>
    value != null && typeof value === "object" && "results" in value && Array.isArray(value.results);

const isErrorResponse = (value: unknown): value is ErrorResponse =>
    value != null && typeof value === "object" && "errored" in value && value.errored === true;

const remote = compileSchema({ $id: "draft2020-12" });
remotes.map((schema: JsonSchema) => remote.addRemoteSchema(schema.$id ?? schema.id, schema));

describe("bowtie (draft7)", async () => {
    before(async () => {
        await runCommand({ cmd: "start", version: 1 });
        await runCommand({ cmd: "dialect", dialect: "http://json-schema.org/draft-07/schema#" });
    });
    after(async () => runCommand({ cmd: "stop" }));

    it("additionalItems as schema - additional items match schema", async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                description: "additionalItems as schema",
                schema: { items: [{}], additionalItems: { type: "integer" } },
                tests: [{ description: "additional items match schema", instance: [null, 2, 3, 4], valid: true }]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, true);
    });

    it("additionalItems as schema - additional items do not match schema", async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                description: "additionalItems as schema",
                schema: { items: [{}], additionalItems: { type: "integer" } },
                tests: [
                    { description: "additional items do not match schema", instance: [null, 2, 3, "foo"], valid: false }
                ]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, false);
    });
});

describe("bowtie (2020-12)", () => {
    describe("validate definition against metaschema", () => {
        const node = compileSchema(
            {
                $schema: "https://json-schema.org/draft/2020-12/schema",
                $ref: "https://json-schema.org/draft/2020-12/schema"
            },
            { remote }
        );

        it("valid definition schema", () => {
            const first = node.validate({ $defs: { foo: { type: "integer" } } });
            assert.deepEqual(first.valid, true);
        });
        it("invalid definition schema", () => {
            const second = node.validate({ $defs: { foo: { type: 1 } } });
            assert.deepEqual(second.valid, false);
        });
    });
});
