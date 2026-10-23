import { strict as assert } from "assert";
import { get } from "@sagold/json-pointer";
import { compileSchema } from "../../compileSchema";
import { extendDraft } from "../../Draft";
import { draft2020 } from "../../draft2020";
import { propertyDependenciesKeyword } from "../../keywords/propertyDependencies";

describe("literal property names in pointers", () => {
    it("escapes schema locations and evaluation paths for nested property dictionaries", () => {
        const node = compileSchema(
            {
                properties: { "a/~ %": { type: "string" } },
                patternProperties: { "^a/~$": { type: "number" } },
                $defs: { "a/~": { type: "boolean" } },
                definitions: { "b/~": { type: "boolean" } },
                dependentSchemas: { "a/~": { required: ["other"] } },
                propertyDependencies: { "a/~": { "b/~": { required: ["other"] } } }
            },
            { drafts: [extendDraft(draft2020, { keywords: [propertyDependenciesKeyword] })] }
        );

        for (const child of node.toSchemaNodes().slice(1)) {
            assert.deepEqual(get(node.schema, child.schemaLocation), child.schema);
            assert.equal(child.evaluationPath, child.schemaLocation);
        }
        assert.equal(node.getNodeChild("a/~ %").node?.schemaLocation, "#/properties/a~1~0%20%25");
        assert.equal(node.propertyDependencies?.["a/~"]["b/~"].schemaLocation, "#/propertyDependencies/a~1~0/b~1~0");
    });

    it("reports data pointers that round-trip through traversal and getNode", () => {
        const node = compileSchema({
            properties: {
                "a/~ %": { properties: { "b/~": { oneOf: [{ type: "number" }] } } }
            }
        });
        const data = { "a/~ %": { "b/~": "invalid" } };
        const { errors } = node.validate(data);
        const pointer = "#/a~1~0 %25/b~1~0";

        assert.equal(errors[0].data.pointer, pointer);
        assert.equal(get(data, pointer), "invalid");
        assert.equal(node.toDataNodes(data).at(-1)?.pointer, pointer);
        assert.equal(node.getNode(pointer, data).error?.data.pointer, pointer);
        assert.equal(node.getNode(pointer, { "a/~ %": { "b/~": 1 } }).node?.schema.type, "number");
        assert.equal(node.validate(data, "/base").errors[0].data.pointer, "/base/a~1~0 %/b~1~0");
    });

    it("escapes pattern, additional and unevaluated property errors", () => {
        const data = { "a/~": "invalid" };
        const pattern = compileSchema({ patternProperties: { "^a/~$": { type: "number" } } });
        const additional = compileSchema({ additionalProperties: false });
        const unevaluated = compileSchema({ unevaluatedProperties: false });

        assert.equal(pattern.validate(data).errors[0].data.pointer, "#/a~1~0");
        assert.equal(additional.validate(data).errors[0].data.pointer, "#/a~1~0");
        assert.equal(unevaluated.validate(data).errors[0].data.pointer, "#/a~1~0");
    });

    it("compiles property names containing an unpaired surrogate", () => {
        const schema = JSON.parse('{"properties":{"\\ud800":{"type":"string"}}}');
        const node = compileSchema(schema);

        assert.equal(node.validate({ ["\ud800"]: "valid" }).valid, true);
        assert.equal(node.validate({ ["\ud800"]: 1 }).valid, false);
        assert.deepEqual(get(schema, node.getNodeChild("\ud800").node?.schemaLocation), { type: "string" });
    });

    it("reports the escaped data pointer for a rejected nested additional property", () => {
        const node = compileSchema({
            properties: { nested: { additionalProperties: false } }
        });
        const data = { nested: { "a/~%": 1 } };
        const { error } = node.getNode("#/nested/a~1~0%25", data);

        assert.equal(error?.code, "no-additional-properties-error");
        assert.equal(error?.data.pointer, "#/nested/a~1~0%25");
        assert.equal(get(data, error?.data.pointer), 1);

        const schemaNode = compileSchema({
            properties: { nested: { additionalProperties: { oneOf: [{ type: "number" }] } } }
        });
        const { error: schemaError } = schemaNode.getNode("#/nested/a~1~0%25", { nested: { "a/~%": "invalid" } });
        assert.equal(schemaError?.data.pointer, "#/nested/a~1~0%25");

        const additional = compileSchema({ additionalProperties: false });
        const options = {};
        assert.equal(additional.getNodeChild("a/~%", undefined, options).error?.data.pointer, "#/a~1~0%25");
        assert.equal(additional.getNodeChild("a/~%", undefined, options).error?.data.pointer, "#/a~1~0%25");
    });
});
