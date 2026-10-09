import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isJsonError, JsonSchema } from "../../types";

describe("data pointer escaping", () => {
    it("distinguishes nested property names containing slashes", () => {
        const node = compileSchema({
            properties: {
                "a/b": { properties: { c: { type: "number" } } },
                a: { properties: { "b/c": { type: "number" } } }
            }
        });
        const { valid, errors } = node.validate({ "a/b": { c: "invalid" }, a: { "b/c": "invalid" } });

        assert.equal(valid, false);
        assert.deepEqual(errors.map((error) => error.data.pointer), ["#/a~1b/c", "#/a/b~1c"]);
        assert.equal(node.validate({ "a/b": { c: 1 }, a: { "b/c": 2 } }).valid, true);
    });

    it("preserves prefixes, empty names and array indexes without re-escaping ancestors", () => {
        const node = compileSchema({
            properties: { "~1/": { properties: { "": { items: { type: "number" } } } } }
        });
        for (const prefix of ["#", "", "/parent~1name", "custom/root~0/"]) {
            const { valid, errors } = node.validate({ "~1/": { "": ["invalid"] } }, prefix);
            assert.equal(valid, false);
            assert.deepEqual(errors.map((error) => error.data.pointer), [`${prefix}/~01~1//0`]);
        }
        assert.equal(node.validate({ "~1/": { "": [1] } }).valid, true);
    });

    const cases: { name: string; schema: JsonSchema; validData: unknown; codes: string[] }[] = [
        {
            name: "additionalProperties schema",
            schema: { additionalProperties: { type: "number" } },
            validData: { "a/b~": 1 },
            codes: ["type-error"]
        },
        {
            name: "additionalProperties false",
            schema: { additionalProperties: false },
            validData: {},
            codes: ["no-additional-properties-error"]
        },
        {
            name: "matching patternProperties",
            schema: { patternProperties: { "^a": { type: "number" } } },
            validData: { "a/b~": 1 },
            codes: ["type-error"]
        },
        {
            name: "unmatched patternProperties with additionalProperties false",
            schema: { patternProperties: { "^z": {} }, additionalProperties: false },
            validData: { z: true },
            codes: ["no-additional-properties-error"]
        },
        {
            name: "unevaluatedProperties schema without a child schema",
            schema: { unevaluatedProperties: { type: "number" } },
            validData: { "a/b~": 1 },
            codes: ["type-error"]
        },
        {
            name: "unevaluatedProperties false without a child schema",
            schema: { unevaluatedProperties: false },
            validData: {},
            codes: ["unevaluated-property-error"]
        },
        {
            name: "unevaluatedProperties schema with an invalid child",
            schema: {
                allOf: [{ properties: { "a/b~": { type: "string" } } }],
                unevaluatedProperties: { type: "number" }
            },
            validData: { "a/b~": "valid" },
            codes: ["type-error", "type-error"]
        },
        {
            name: "unevaluatedProperties false with an invalid child",
            schema: {
                allOf: [{ properties: { "a/b~": { type: "string" } } }],
                unevaluatedProperties: false
            },
            validData: { "a/b~": "valid" },
            codes: ["type-error", "unevaluated-property-error"]
        }
    ];

    for (const { name, schema, validData, codes } of cases) {
        it(`escapes property names in ${name} errors`, () => {
            const node = compileSchema(schema);
            const { valid, errors } = node.validate({ "a/b~": true });

            assert.equal(valid, false);
            assert.deepEqual(errors.map((error) => error.code), codes);
            assert.deepEqual(errors.map((error) => error.data.pointer), codes.map(() => "#/a~1b~0"));
            assert.equal(node.validate(validData).valid, true);
        });
    }

    it("escapes the nested propertyNames error while retaining the containing object pointer", () => {
        const node = compileSchema({ propertyNames: { pattern: "^[a-z]+$" } });
        const { valid, errors } = node.validate({ "a/b~": 1 });

        assert.equal(valid, false);
        assert.equal(errors.length, 1);
        assert.equal(errors[0].code, "invalid-property-name-error");
        assert.equal(errors[0].data.pointer, "#");
        const validationError = errors[0].data.validationError;
        assert(isJsonError(validationError));
        assert.equal(validationError.data.pointer, "#/a~1b~0");
        assert.equal(node.validate({ abc: 1 }).valid, true);
    });

    for (const method of ["validate", "reduceNode"] as const) {
        it(`escapes nested oneOf declarator errors from ${method}`, () => {
            const node = compileSchema({
                oneOfProperty: "a/b~",
                oneOf: [
                    { properties: { "a/b~": { const: "first" } } },
                    { properties: { "a/b~": { const: "second" } } }
                ]
            });
            const data = { "a/b~": "unknown" };
            const error = method === "validate" ? node.validate(data).errors[0] : node.reduceNode(data).error;

            assert(error);
            assert.equal(error.code, method === "validate" ? "one-of-error" : "one-of-property-error");
            const nestedErrors = error.data.errors;
            assert(Array.isArray(nestedErrors));
            assert.equal(nestedErrors.length, 2);
            for (const nestedError of nestedErrors) {
                assert(isJsonError(nestedError));
                assert.equal(nestedError.data.pointer, "#/a~1b~0");
            }
            assert.equal(node.validate({ "a/b~": "first" }).valid, true);
            assert(node.reduceNode({ "a/b~": "first" }).node);
        });
    }

    it("escapes traversal warning pointers in getNode", () => {
        const node = compileSchema({ properties: { "a/b": {} } });
        const { error } = node.getNode("#/a~1b/~0", { "a/b": { "~": 1 } }, { withSchemaWarning: true });

        assert(error);
        assert.equal(error.code, "schema-warning");
        assert.equal(error.data.pointer, "#/a~1b/~0");
    });

    it("escapes toDataNodes pointers while preserving values, prefixes, empty names and indexes", () => {
        const node = compileSchema({
            properties: { "~1/": { properties: { "": { items: { type: "number" } } } } }
        });
        const data = { "~1/": { "": [1] } };
        for (const prefix of ["#", "", "/parent~1name", "custom/root~0/"]) {
            const nodes = node.toDataNodes(data, prefix);
            assert.deepEqual(nodes.map(({ pointer, value }) => [pointer, value]), [
                [prefix, data],
                [`${prefix}/~01~1`, { "": [1] }],
                [`${prefix}/~01~1/`, [1]],
                [`${prefix}/~01~1//0`, 1]
            ]);
        }
    });
});
