import { strict as assert } from "node:assert";
import { compileSchema } from "../src/compileSchema";
import { remotes } from "json-schema-library/remotes";
import { JsonSchema } from "../src/types";
import { runCommand } from "./bowtie-jlib";
import { ErrorResponse, RunCmdResponse } from "./bowtie-api";

const isRunCmdResponse = (value: unknown): value is RunCmdResponse =>
    value != null && typeof value === "object" && "results" in value && Array.isArray(value.results);

const isErrorResponse = (value: unknown): value is ErrorResponse =>
    value != null && typeof value === "object" && "errored" in value && value.errored === true;

const remote = compileSchema({ $id: "draft2020-12" });
remotes.map((schema: JsonSchema) => remote.addRemoteSchema(schema.$id ?? schema.id, schema));

describe("bowtie (draft4)", async () => {
    before(async () => {
        await runCommand({ cmd: "start", version: 1 });
        await runCommand({ cmd: "dialect", dialect: "http://json-schema.org/draft-04/schema#" });
    });
    after(async () => runCommand({ cmd: "stop" }));

    const registry = {
        "http://localhost:1234/draft4/name.json": {
            definitions: { orNull: { anyOf: [{ type: "null" }, { $ref: "#" }] } },
            type: "string"
        },
        "http://localhost:1234/v1/nested-absolute-ref-to-string.json": {
            $defs: { bar: { $id: "http://localhost:1234/v1/the-nested-id.json", type: "string" } },
            $ref: "http://localhost:1234/v1/the-nested-id.json"
        },
        "http://localhost:1234/nested/string.json": { type: "string" },
        "http://localhost:1234/baseUriChange/folderInteger.json": { type: "integer" },
        "http://localhost:1234/draft4/subSchemas.json": {
            definitions: { integer: { type: "integer" }, refToInteger: { $ref: "#/definitions/integer" } }
        },
        "http://localhost:1234/v1/different-id-ref-string.json": {
            $id: "http://localhost:1234/v1/real-id-ref-string.json",
            $defs: { bar: { type: "string" } },
            $ref: "#/$defs/bar"
        },
        "http://localhost:1234/v1/urn-ref-string.json": {
            $id: "urn:uuid:feebdaed-ffff-0000-ff01-0000deadbeef",
            $defs: { bar: { type: "string" } },
            $ref: "#/$defs/bar"
        },
        "http://localhost:1234/integer.json": { type: "integer" },
        "http://localhost:1234/nested/foo-ref-string.json": {
            type: "object",
            properties: { foo: { $ref: "string.json" } }
        },
        "http://localhost:1234/baseUriChangeFolder/folderInteger.json": { type: "integer" },
        "http://localhost:1234/draft4/locationIndependentIdentifier.json": {
            definitions: { refToInteger: { $ref: "#foo" }, A: { id: "#foo", type: "integer" } }
        },
        "http://localhost:1234/baseUriChangeFolderInSubschema/folderInteger.json": { type: "integer" }
    };

    it("Location-independent identifier in remote ref - additional items match schema", async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                description: "Location-independent identifier in remote ref",
                schema: {
                    $ref: "http://localhost:1234/draft4/locationIndependentIdentifier.json#/definitions/refToInteger"
                },
                registry,
                tests: [{ description: "integer is valid", instance: 1, valid: true }]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, true);
    });

    it("Location-independent identifier in remote ref - additional items do not match schema", async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                description: "Location-independent identifier in remote ref",
                schema: {
                    $ref: "http://localhost:1234/draft4/locationIndependentIdentifier.json#/definitions/refToInteger"
                },
                registry,
                tests: [{ description: "string is invalid", instance: "foo", valid: false }]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, false);
    });
});

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

describe("bowtie (2019-09)", () => {
    const testCase = {
        description: "schema that uses custom metaschema with with no validation vocabulary",
        schema: {
            $id: "https://schema/using/no/validation",
            $schema: "http://localhost:1234/draft2019-09/metaschema-no-validation.json",
            properties: { badProperty: false, numberProperty: { minimum: 10 } }
        },
        registry: {
            "http://localhost:1234/draft2019-09/integer.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "integer"
            },
            "http://localhost:1234/draft2019-09/dependentRequired.json": {
                $id: "http://localhost:1234/draft2019-09/dependentRequired.json",
                $schema: "https://json-schema.org/draft/2019-09/schema",
                dependentRequired: { foo: ["bar"] }
            },
            "http://localhost:1234/draft2019-09/detached-ref.json": {
                $id: "http://localhost:1234/draft2019-09/detached-ref.json",
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: { foo: { $ref: "#detached" }, detached: { $anchor: "detached", type: "integer" } }
            },
            "http://localhost:1234/integer.json": { type: "integer" },
            "http://localhost:1234/draft2019-09/nested/foo-ref-string.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "object",
                properties: { foo: { $ref: "string.json" } }
            },
            "http://localhost:1234/draft2019-09/urn-ref-string.json": {
                $id: "urn:uuid:feebdaed-ffff-0000-2019-0900deadbeef",
                $defs: { bar: { type: "string" } },
                $ref: "#/$defs/bar"
            },
            "http://localhost:1234/draft2019-09/locationIndependentIdentifier.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: { refToInteger: { $ref: "#foo" }, A: { $anchor: "foo", type: "integer" } }
            },
            "http://localhost:1234/baseUriChangeFolder/folderInteger.json": { type: "integer" },
            "http://localhost:1234/draft2019-09/baseUriChange/folderInteger.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "integer"
            },
            "http://localhost:1234/draft2019-09/ref-and-defs.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:1234/draft2019-09/ref-and-defs.json",
                $defs: { inner: { properties: { bar: { type: "string" } } } },
                $ref: "#/$defs/inner"
            },
            "http://localhost:1234/baseUriChangeFolderInSubschema/folderInteger.json": { type: "integer" },
            "http://localhost:1234/draft2019-09/baseUriChangeFolder/folderInteger.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "integer"
            },
            "http://localhost:1234/nested/foo-ref-string.json": {
                type: "object",
                properties: { foo: { $ref: "string.json" } }
            },
            "http://localhost:1234/nested/string.json": { type: "string" },
            "http://localhost:1234/draft2019-09/baseUriChangeFolderInSubschema/folderInteger.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "integer"
            },
            "http://localhost:1234/draft2019-09/name-defs.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: { orNull: { anyOf: [{ type: "null" }, { $ref: "#" }] } },
                type: "string"
            },
            "http://localhost:1234/v1/different-id-ref-string.json": {
                $id: "http://localhost:1234/v1/real-id-ref-string.json",
                $defs: { bar: { type: "string" } },
                $ref: "#/$defs/bar"
            },
            "http://localhost:1234/v1/nested-absolute-ref-to-string.json": {
                $defs: { bar: { $id: "http://localhost:1234/v1/the-nested-id.json", type: "string" } },
                $ref: "http://localhost:1234/v1/the-nested-id.json"
            },
            "http://localhost:1234/v1/urn-ref-string.json": {
                $id: "urn:uuid:feebdaed-ffff-0000-ff01-0000deadbeef",
                $defs: { bar: { type: "string" } },
                $ref: "#/$defs/bar"
            },
            "http://localhost:1234/draft2019-09/ignore-prefixItems.json": {
                $id: "http://localhost:1234/draft2019-09/ignore-prefixItems.json",
                $schema: "https://json-schema.org/draft/2019-09/schema",
                prefixItems: [{ type: "string" }]
            },
            "http://localhost:1234/draft2019-09/subSchemas.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $defs: { integer: { type: "integer" }, refToInteger: { $ref: "#/$defs/integer" } }
            },
            "http://localhost:1234/draft2019-09/nested-absolute-ref-to-string.json": {
                $defs: { bar: { $id: "http://localhost:1234/draft2019-09/the-nested-id.json", type: "string" } },
                $ref: "http://localhost:1234/draft2019-09/the-nested-id.json"
            },
            "http://localhost:1234/draft2019-09/nested/string.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                type: "string"
            },
            "http://localhost:1234/draft2019-09/metaschema-optional-vocabulary.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:1234/draft2019-09/metaschema-optional-vocabulary.json",
                $vocabulary: {
                    "https://json-schema.org/draft/2019-09/vocab/validation": true,
                    "https://json-schema.org/draft/2019-09/vocab/core": true,
                    "http://localhost:1234/draft/2019-09/vocab/custom": false
                },
                $recursiveAnchor: true,
                allOf: [
                    { $ref: "https://json-schema.org/draft/2019-09/meta/validation" },
                    { $ref: "https://json-schema.org/draft/2019-09/meta/core" }
                ]
            },
            "http://localhost:1234/draft2019-09/different-id-ref-string.json": {
                $id: "http://localhost:1234/draft2019-09/real-id-ref-string.json",
                $defs: { bar: { type: "string" } },
                $ref: "#/$defs/bar"
            },
            "http://localhost:1234/draft2019-09/extendible-dynamic-ref.json": {
                description: "extendible array",
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:1234/draft2019-09/extendible-dynamic-ref.json",
                type: "object",
                properties: { elements: { type: "array", items: { $dynamicRef: "#elements" } } },
                required: ["elements"],
                additionalProperties: false,
                $defs: { elements: { $dynamicAnchor: "elements" } }
            },
            "http://localhost:1234/draft2019-09/metaschema-no-validation.json": {
                $schema: "https://json-schema.org/draft/2019-09/schema",
                $id: "http://localhost:1234/draft2019-09/metaschema-no-validation.json",
                $vocabulary: {
                    "https://json-schema.org/draft/2019-09/vocab/applicator": true,
                    "https://json-schema.org/draft/2019-09/vocab/core": true
                },
                $recursiveAnchor: true,
                allOf: [
                    { $ref: "https://json-schema.org/draft/2019-09/meta/applicator" },
                    { $ref: "https://json-schema.org/draft/2019-09/meta/core" }
                ]
            },
            "http://localhost:1234/baseUriChange/folderInteger.json": { type: "integer" }
        }
    };

    before(async () => {
        await runCommand({ cmd: "start", version: 1 });
        await runCommand({ cmd: "dialect", dialect: "https://json-schema.org/draft/2019-09/schema" });
    });
    after(async () => runCommand({ cmd: "stop" }));

    it(`${testCase.description} - applicator vocabulary still works`, async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                ...testCase,
                tests: [
                    {
                        description: "applicator vocabulary still works",
                        instance: { badProperty: "this property should not exist" },
                        valid: false
                    }
                ]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, false);
    });

    it(`${testCase.description} - no validation: valid number`, async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                ...testCase,
                tests: [
                    {
                        description: "no validation: valid number",
                        instance: { numberProperty: 20 },
                        valid: true
                    }
                ]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, true);
    });

    it(`${testCase.description} - no validation: invalid number, but it still validates`, async () => {
        const response = await runCommand({
            cmd: "run",
            seq: 1,
            case: {
                ...testCase,
                tests: [
                    {
                        description: "no validation: invalid number, but it still validates",
                        instance: { numberProperty: 1 },
                        valid: true
                    }
                ]
            }
        });
        assert(isRunCmdResponse(response));
        assert(!isErrorResponse(response.results[0]));
        assert.equal(response.results[0].valid, true);
    });
});
