import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("literal prototype property names", () => {
    it("rejects undeclared prototype members with patternProperties", () => {
        const node = compileSchema({
            patternProperties: { "^allowed$": true },
            additionalProperties: false
        });

        const { errors } = node.validate({ constructor: 1, toString: 2, hasOwnProperty: 3 });

        assert.deepEqual(
            errors.map((error) => error.data.pointer),
            ["#/constructor", "#/toString", "#/hasOwnProperty"]
        );
        assert.equal(node.getNodeChild("constructor").error?.code, "no-additional-properties-error");
        assert.equal(
            compileSchema({ properties: {}, additionalProperties: false }).validate({ constructor: 1 }).valid,
            false
        );
    });

    it("preserves __proto__ when properties are compiled and merged", () => {
        const node = compileSchema({
            properties: { ["__proto__"]: { type: "string" } },
            allOf: [{ properties: { ["__proto__"]: { minLength: 2 }, constructor: { type: "number" } } }]
        });

        assert.equal(node.validate({ ["__proto__"]: 1 }).valid, false);
        assert.deepEqual(node.getNode("#/__proto__", { ["__proto__"]: "ok" }).node?.schema, {
            type: "string",
            minLength: 2
        });
        assert.equal(node.getNode("#/constructor", { constructor: 1 }).node?.schema.type, "number");
        assert.deepEqual(node.getData({ ["__proto__"]: "ok", constructor: 1 }), {
            ["__proto__"]: "ok",
            constructor: 1
        });
        assert.equal(node.createSchema({ ["__proto__"]: "ok" }).properties["__proto__"].type, "string");
    });

    it("applies dependency requirements to own properties only", () => {
        const node = compileSchema({ dependentRequired: { ["__proto__"]: ["constructor"] } });

        assert.equal(node.validate({}).valid, true);
        assert.equal(node.validate({ ["__proto__"]: true }).valid, false);
        assert.equal(node.validate({ ["__proto__"]: true, constructor: 1 }).valid, true);
        assert.equal(
            compileSchema({ dependentRequired: { trigger: ["constructor"] } }).validate({ trigger: true }).valid,
            false
        );
    });

    it("preserves prototype names in schema and legacy dependencies", () => {
        const schema = { ["__proto__"]: { required: ["value"] } };
        const node = compileSchema({ dependentSchemas: schema });
        const legacy = compileSchema({ dependencies: schema }, { draft: "draft-7" });

        assert.deepEqual(
            node.toSchemaNodes().map((child) => child.schemaLocation),
            ["#", "#/dependentSchemas/__proto__"]
        );
        assert.deepEqual(
            legacy.toSchemaNodes().map((child) => child.schemaLocation),
            ["#", "#/dependencies/__proto__"]
        );
        assert.equal(node.validate({ ["__proto__"]: true }).valid, false);
        assert.equal(legacy.validate({ ["__proto__"]: true }).valid, false);
        assert.equal(node.getNode("#", { constructor: 1 }).error, undefined);
        assert.equal(legacy.getNode("#", { ["__proto__"]: true, value: 1 }).error, undefined);
    });
});
