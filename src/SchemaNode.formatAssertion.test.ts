import { strict as assert } from "assert";
import { compileSchema, type CompileOptions } from "./compileSchema";
import { draft04 } from "./draft04";
import { draft06 } from "./draft06";
import { draft07 } from "./draft07";
import { draft2019 } from "./draft2019";
import { draft2020 } from "./draft2020";
import { isSchemaNode, type SchemaNode } from "./SchemaNode";

const emailSchema = { type: "string", format: "email", minLength: 5 };
const remoteUri = "https://example.com/email";
const canonicalUri = "https://example.com/canonical-email";
const policies: CompileOptions[] = [{ formatAssertion: false }, { formatAssertion: true }, {}];

function assertEmailPolicy(node: SchemaNode, assertions: boolean) {
    for (const { value, codes } of [
        { value: "reader@example.com", codes: [] },
        { value: "not-an-email", codes: assertions ? ["format-email-error"] : [] },
        { value: 7, codes: ["type-error"] },
        { value: "a@b", codes: ["min-length-error"] }
    ]) {
        const result = node.validate(value);
        assert.equal(result.valid, codes.length === 0, JSON.stringify(value));
        assert.deepEqual(result.errors.map((error) => error.code), codes);
    }
}

describe("addRemoteSchema formatAssertion", () => {
    for (const draft of [draft04, draft06, draft07, draft2019, draft2020]) {
        for (const options of policies) {
            describe(`${draft.version}, formatAssertion: ${options.formatAssertion ?? "default"}`, () => {
                const assertions = options.formatAssertion !== false;
                const identifier = draft === draft04 ? "id" : "$id";
                const anchor =
                    draft === draft2019 || draft === draft2020 ? { $anchor: "email" } : { [identifier]: "#email" };

                it("should preserve the direct schema policy", () => {
                    assertEmailPolicy(compileSchema({ $schema: draft.$schema, ...emailSchema }, options), assertions);
                });

                it("should apply the policy to a registered remote", () => {
                    const node = compileSchema({ $schema: draft.$schema, $ref: remoteUri }, options).addRemoteSchema(
                        remoteUri,
                        { $schema: draft.$schema, ...emailSchema }
                    );
                    assertEmailPolicy(node, assertions);
                });

                it("should apply the policy when the retrieval URI differs from the schema identifier", () => {
                    const node = compileSchema({ $schema: draft.$schema, $ref: remoteUri }, options).addRemoteSchema(
                        remoteUri,
                        { $schema: draft.$schema, [identifier]: canonicalUri, ...emailSchema }
                    );
                    assertEmailPolicy(node, assertions);
                });

                it("should apply the policy to an anchored remote subschema", () => {
                    const node = compileSchema(
                        { $schema: draft.$schema, $ref: `${remoteUri}#email` },
                        options
                    ).addRemoteSchema(remoteUri, {
                        $schema: draft.$schema,
                        [identifier]: remoteUri,
                        definitions: { email: { ...anchor, ...emailSchema } }
                    });
                    assertEmailPolicy(node, assertions);
                });
            });
        }
    }

    it("should keep validating remote format keywords when assertions are disabled", () => {
        const node = compileSchema({}, { formatAssertion: false });
        node.addRemoteSchema(remoteUri, { format: 0 });

        assert.deepEqual(node.schemaErrors?.map((error) => error.code), ["schema-error"]);
        assert.deepEqual(node.schemaAnnotations, []);
    });

    for (const options of policies) {
        it(`should preserve formatAssertion: ${options.formatAssertion ?? "default"} through remote registration`, () => {
            const firstUri = "https://example.com/first";
            const node = compileSchema({ $ref: firstUri }, options).addRemoteSchema(firstUri, { $ref: remoteUri });
            const firstRemote = node.getNodeRef(firstUri);
            assert(isSchemaNode(firstRemote));
            firstRemote.addRemoteSchema(remoteUri, { ...emailSchema });

            assertEmailPolicy(node, options.formatAssertion !== false);
        });
    }

    for (const formatAssertion of [false, true]) {
        it(`should use the registering owner's explicit policy ${formatAssertion}`, () => {
            const existingUri = "https://example.com/existing";
            const remote = compileSchema({ $id: existingUri, ...emailSchema }, { formatAssertion: !formatAssertion });
            const node = compileSchema({ $ref: remoteUri }, { remote, formatAssertion }).addRemoteSchema(remoteUri, {
                ...emailSchema
            });

            assertEmailPolicy(node, formatAssertion);
            assertEmailPolicy(compileSchema({ $ref: existingUri }, { remote, formatAssertion }), !formatAssertion);
            assertEmailPolicy(remote, !formatAssertion);
        });
    }

    for (const assertion of [false, true, undefined]) {
        it(`should preserve the effective meta-schema policy (${assertion ?? "unspecified"})`, () => {
            const metaUri = "https://example.com/meta";
            const remote = compileSchema({
                $id: metaUri,
                $vocabulary:
                    assertion === undefined
                        ? {}
                        : { "https://json-schema.org/draft/2020-12/vocab/format-assertion": assertion }
            });
            const node = compileSchema(
                { $schema: metaUri, $ref: remoteUri },
                { remote, formatAssertion: "meta-schema" }
            ).addRemoteSchema(remoteUri, { ...emailSchema });

            assertEmailPolicy(node, assertion !== false);
        });
    }
});
