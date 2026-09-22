import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draft04 } from "../../draft04";
import { draft06 } from "../../draft06";
import { draft07 } from "../../draft07";
import { draft2019 } from "../../draft2019";
import { draft2020 } from "../../draft2020";
import { extendDraft } from "../../Draft";
import { propertyDependenciesKeyword } from "../../keywords/propertyDependencies";
import { isJsonError, isSchemaNode, JsonSchema } from "../../types";

// Literal names and their RFC 6901 URI-fragment tokens, independent of the encoder under test.
const keys = [
    ["a~1b", "a~01b"],
    ["a/b", "a~1b"],
    ["m~n", "m~0n"],
    ["c%d", "c%25d"],
    ["with space", "with%20space"],
    ["日本", "%E6%97%A5%E6%9C%AC"]
];

for (const draft of [draft04, draft06, draft07, draft2019, draft2020]) {
    describe(`schema-location keys (${draft.version})`, () => {
        const options = { drafts: [draft] };
        const keywords = ["$defs", "definitions", "properties", "patternProperties", "dependencies", "dependentSchemas"].filter(
            (keyword) => draft.keywords.some((entry) => entry.keyword === (keyword === "definitions" ? "$defs" : keyword))
        );

        it("resolves encoded pointer separators before selecting schema locations", () => {
            const id = draft.version === "draft-04" ? "id" : "$id";
            for (const [ref, type, valid, wrongType, wrongValue] of [
                ["#/definitions/target", "string", "valid", 1, "x"],
                ["#%2Fdefinitions%2Ftarget", "string", "valid", 1, "x"],
                ["#%2fdefinitions%2ftarget", "string", "valid", 1, "x"],
                ["#/definitions%2Ftarget", "string", "valid", 1, "x"],
                ["#%2Fdefinitions%2Fa%252Fb", "number", 2, "wrong", 1],
                ["#%2Fdefinitions%2Fa%23%252Fb", "boolean", true, 1, false]
            ] as const) {
                const node = compileSchema({
                    [id]: "https://example.test/path%2Froot",
                    definitions: {
                        target: { type: "string", minLength: 2 },
                        "a%2Fb": { type: "number", minimum: 2 },
                        "a#%2Fb": { type: "boolean", enum: [true] },
                        "a/b": { type: "string" },
                        "a#/b": { type: "number" }
                    },
                    "/definitions/target": { type: "number" },
                    "definitions/target": { type: "number" },
                    properties: { child: { $ref: ref } }
                }, options);
                const child = node.properties?.child;
                assert.ok(child);
                const target = child.resolveRef();
                assert.ok(isSchemaNode(target), ref);
                assert.equal(target.type, type, ref);
                assert.deepEqual(
                    [valid, wrongType, wrongValue].map((value) => node.validate({ child: value }).valid),
                    [true, false, false], ref
                );
            }
        });

        for (const keyword of keywords) {
            it(`preserves literal ${keyword} keys in references, locations and traversal`, () => {
                const targets = Object.fromEntries(
                    keys.map(([key]) => [key, { type: key === "a~1b" ? "number" : "string" }])
                );
                const references = Object.fromEntries(
                    keys.map(([, token], index) => [`ref${index}`, { $ref: `#/${keyword}/${token}` }])
                );
                const schema: JsonSchema = {
                    [keyword]: targets,
                    properties: { ...(keyword === "properties" ? targets : {}), ...references }
                };
                const node = compileSchema(schema, options);
                assert.deepEqual(node.schemaErrors, []);
                const data = Object.fromEntries(
                    keys.map(([key], index) => [`ref${index}`, key === "a~1b" ? 7 : "text"])
                );
                assert.equal(node.validate(data).valid, true);
                const visited = node.toSchemaNodes();
                keys.forEach(([key, token], index) => {
                    assert.equal(node.validate({ [`ref${index}`]: key === "a~1b" ? "text" : 7 }).valid, false);
                    const target = visited.find((entry) => entry.schema === targets[key]);
                    assert.ok(target, `missing ${keyword}[${key}] from traversal`);
                    assert.equal(target.evaluationPath, `#/${keyword}/${token}`);
                    assert.equal(target.schemaLocation, `#/${keyword}/${token}`);
                });
            });

            it(`resolves equivalent ${keyword} fragments in root and nested identifier scopes`, () => {
                const id = draft.version === "draft-04" ? "id" : "$id";
                const rootId = "https://example.test/cost%24/root";
                const targets = {
                    "cost$": { type: "string", minLength: 3 },
                    "cost%24": { type: "number", minimum: 2 }
                };
                const nestedTargets = { "cost$": targets["cost%24"], "cost%24": targets["cost$"] };
                const references = [
                    { prefix: `#/${keyword}/`, nested: false },
                    { prefix: `${rootId}#/${keyword}/`, nested: false },
                    { prefix: `child%24#/${keyword}/`, nested: true },
                    { prefix: `https://example.test/cost%24/child%24#/${keyword}/`, nested: true },
                    { prefix: `${rootId}#/properties/scope/${keyword}/`, nested: true }
                ].flatMap(({ prefix, nested }) =>
                    ["cost$", "cost%24", "cost%2524"].map((token) => ({
                        ref: `${prefix}${token}`,
                        numeric: (token === "cost%2524") !== nested
                    }))
                );
                const node = compileSchema(
                    {
                        [id]: rootId,
                        [keyword]: targets,
                        properties: {
                            ...(keyword === "properties" ? targets : {}),
                            scope: {
                                [id]: "child%24",
                                [keyword]: nestedTargets,
                                properties: {
                                    ...(keyword === "properties" ? nestedTargets : {}),
                                    local: { $ref: `#/${keyword}/cost$` }
                                }
                            },
                            ...Object.fromEntries(references.map(({ ref }, index) => [`ref${index}`, { $ref: ref }]))
                        }
                    },
                    options
                );
                assert.deepEqual(node.schemaErrors, []);
                references.forEach(({ ref, numeric }, index) => {
                    assert.equal(node.validate({ [`ref${index}`]: numeric ? 2 : "text" }).valid, true, ref);
                    assert.equal(node.validate({ [`ref${index}`]: numeric ? "text" : 2 }).valid, false, ref);
                    assert.equal(node.validate({ [`ref${index}`]: numeric ? 1 : "ab" }).valid, false, ref);
                });
                assert.equal(node.validate({ scope: { local: 2 } }).valid, true);
                assert.equal(node.validate({ scope: { local: "text" } }).valid, false);
                assert.equal(node.validate({ scope: { local: 1 } }).valid, false);
            });

            it(`reports encoded ${keyword} locations for invalid subschemas`, () => {
                const node = compileSchema(
                    { [keyword]: Object.fromEntries(keys.map(([key]) => [key, { type: "invalid-type" }])) },
                    options
                );
                assert.deepEqual(
                    node.schemaErrors?.map(({ data }) => data.pointer).sort(),
                    keys.map(([, token]) => `#/${keyword}/${token}/type`).sort()
                );
            });
        }

        for (const keyword of ["$defs", "definitions"]) {
            it(`visits and validates a literal __proto__ ${keyword} entry`, () => {
                const definition = { type: "string", minLength: 3 };
                const node = compileSchema(
                    {
                        [keyword]: { ["__proto__"]: definition },
                        properties: { child: { $ref: `#/${keyword}/__proto__` } }
                    },
                    options
                );
                assert.deepEqual(node.schemaErrors, []);
                assert.deepEqual(Object.keys(node.$defs ?? {}), ["__proto__"]);
                const target = node.$defs?.["__proto__"];
                assert.ok(target);
                assert.ok(Object.values(node.$defs ?? {}).includes(target));
                assert.ok(node.toSchemaNodes().includes(target));
                assert.equal(target.schema, definition);
                assert.equal(target.schemaLocation, `#/${keyword}/__proto__`);
                assert.equal(node.validate({ child: "text" }).valid, true);
                assert.equal(node.validate({ child: 7 }).valid, false);
                assert.equal(node.validate({ child: "ab" }).valid, false);
            });

            it(`exposes an unresolved reference in a literal __proto__ ${keyword} entry`, () => {
                const missing = "https://example.test/unregistered";
                const node = compileSchema(
                    {
                        [keyword]: { ["__proto__"]: { $ref: missing } },
                        properties: { child: { $ref: `#/${keyword}/__proto__` } }
                    },
                    { ...options, throwOnInvalidRef: true }
                );
                const reference = node.toSchemaNodes().find(({ schema }) => schema.$ref === missing);
                assert.ok(reference);
                assert.equal(reference.schemaLocation, `#/${keyword}/__proto__`);
                const unresolved = reference.getNodeRef(missing);
                assert.ok(isJsonError(unresolved));
                assert.equal(unresolved.code, "ref-error");
                assert.equal(unresolved.data.ref, missing);
                assert.throws(() => node.validate({ child: "text" }), /Invalid \$ref:/);
            });
        }

        it("preserves references containing URI-legal unescaped characters", () => {
            const node = compileSchema(
                {
                    properties: {
                        "cost$": { type: "string" },
                        child: { $ref: "#/properties/cost$" }
                    }
                },
                options
            );
            assert.equal(node.validate({ child: "text" }).valid, true);
            assert.equal(node.validate({ child: 7 }).valid, false);
        });

        for (const rootId of [undefined, "https://example.test/cost%24/root"]) {
            it(`round-trips fragment spellings ${rootId ? "with" : "without"} a root identifier`, () => {
                const id = draft.version === "draft-04" ? "id" : "$id";
                const targets = Object.fromEntries([
                    ...keys.map(([key]) => [key, { type: "string", minLength: 3 }]),
                    ["cost$", { type: "string", minLength: 3 }],
                    ["cost%24", { type: "number", minimum: 2 }]
                ]);
                for (const keyword of ["properties", "$defs", "definitions"]) {
                    const tokens = [...keys.map(([, token]) => token), "cost$", "cost%24", "cost%2524"];
                    const node = compileSchema(
                        {
                            ...(rootId ? { [id]: rootId } : {}),
                            [keyword]: targets,
                            properties: {
                                ...(keyword === "properties" ? targets : {}),
                                ...Object.fromEntries(
                                    tokens.map((token, index) => [
                                        `ref${index}`, { $ref: `${rootId ?? ""}#/${keyword}/${token}` }
                                    ])
                                )
                            }
                        },
                        options
                    );
                    assert.deepEqual(node.schemaErrors, []);
                    tokens.forEach((token, index) => {
                        const numeric = token === "cost%2524";
                        assert.equal(node.validate({ [`ref${index}`]: numeric ? 2 : "text" }).valid, true, token);
                        assert.equal(node.validate({ [`ref${index}`]: numeric ? "text" : 2 }).valid, false, token);
                        assert.equal(node.validate({ [`ref${index}`]: numeric ? 1 : "ab" }).valid, false, token);
                    });
                }
            });
        }

        it("keeps percent decoding specific to URI fragments", () => {
            const node = compileSchema(
                { properties: { "value%20name": { type: "number" }, "value name": { type: "string" } } },
                options
            );
            for (const pointer of ["/value%20name", "#/value%2520name"]) {
                const target = node.getNode(pointer).node;
                assert.ok(target);
                assert.equal(target.validate(7).valid, true);
                assert.equal(target.validate("text").valid, false);
            }
            for (const pointer of ["/value name", "#/value%20name"]) {
                const target = node.getNode(pointer).node;
                assert.ok(target);
                assert.equal(target.validate("text").valid, true);
                assert.equal(target.validate(7).valid, false);
            }
        });

        for (const [key, token] of [
            ["item", "%69tem"],
            ["__proto__", "%5F_proto__"],
            ["definitions", "%64efinitions"]
        ]) {
            it(`keeps overlapping definition namespaces for ${key} in traversal and references`, () => {
                const id = draft.version === "draft-04" ? "id" : "$id";
                const modern = { type: "string", minLength: 3 };
                const legacy = { type: "number", minimum: 2 };
                const node = compileSchema(
                    {
                        [id]: "https://example.test/root",
                        $defs: { [key]: modern },
                        definitions: { [key]: legacy },
                        properties: {
                            modern: { $ref: `#/$defs/${token}` },
                            legacy: { $ref: `#/definitions/${token}` }
                        }
                    },
                    options
                );
                assert.deepEqual(node.schemaErrors, []);
                assert.equal(node.validate({ modern: "text", legacy: 2 }).valid, true);
                assert.equal(node.validate({ modern: 2 }).valid, false);
                assert.equal(node.validate({ modern: "ab" }).valid, false);
                assert.equal(node.validate({ legacy: "text" }).valid, false);
                assert.equal(node.validate({ legacy: 1 }).valid, false);
                assert.equal(node.$defs?.[key].schema, modern);
                assert.equal(node.definitions?.[key].schema, legacy);
                const visited = node.toSchemaNodes();
                assert.equal(visited.filter((entry) => entry.schema === modern).length, 1);
                assert.equal(visited.filter((entry) => entry.schema === legacy).length, 1);
            });

            it(`exposes unresolved references in both overlapping ${key} definitions`, () => {
                const refs = [
                    "https://example.test/unregistered-modern",
                    "https://example.test/unregistered-legacy"
                ];
                const node = compileSchema(
                    { $defs: { [key]: { $ref: refs[0] } }, definitions: { [key]: { $ref: refs[1] } } },
                    options
                );
                const references = node.toSchemaNodes().filter(({ schema }) => schema.$ref != null);
                assert.deepEqual(references.map(({ schema }) => schema.$ref).sort(), refs.slice().sort());
                for (const reference of references) {
                    const unresolved = reference.getNodeRef(reference.schema.$ref);
                    assert.ok(isJsonError(unresolved));
                    assert.equal(unresolved.code, "ref-error");
                }
            });
        }

        it("retains the single legacy dictionary alias without duplicate visits", () => {
            const node = compileSchema({ definitions: { item: { type: "string" } } }, options);
            assert.equal(node.definitions, node.$defs);
            assert.equal(node.definitions?.item.schema.type, "string");
            assert.deepEqual(node.toSchemaNodes(), [node, node.definitions?.item]);
        });

        it("registers encoded descendants in the scope of a nested identifier", () => {
            const id = draft.version === "draft-04" ? "id" : "$id";
            const node = compileSchema(
                {
                    [id]: "https://example.test/root",
                    properties: {
                        "outer/key": {
                            [id]: "child",
                            properties: { "a~1b": { type: "number" }, "a/b": { type: "string" } }
                        },
                        child: { $ref: "https://example.test/child#/properties/a~1b" }
                    }
                },
                options
            );
            assert.equal(node.validate({ child: "text" }).valid, true);
            assert.equal(node.validate({ child: 7 }).valid, false);
            const target = node.properties?.["outer/key"].properties?.["a/b"];
            assert.equal(target?.evaluationPath, "#/properties/outer~1key/properties/a~1b");
            assert.equal(target?.schemaLocation, "#/properties/outer~1key/properties/a~1b");
        });
    });
}

describe("keyed schema diagnostics", () => {
    for (const keyword of ["dependentRequired", "dependentSchemas"]) {
        it(`encodes invalid ${keyword} entry locations`, () => {
            const node = compileSchema({ [keyword]: { "a/b~c %日本": 7 } });
            assert.deepEqual(node.schemaErrors?.map(({ data }) => data.pointer), [
                `#/${keyword}/a~1b~0c%20%25%E6%97%A5%E6%9C%AC`
            ]);
        });
    }
});

describe("schema-location keys in the opt-in propertyDependencies keyword", () => {
    const options = { drafts: [extendDraft(draft2020, { keywords: [propertyDependenciesKeyword] })] };

    it("encodes both property and value tokens without collisions", () => {
        const node = compileSchema(
            {
                propertyDependencies: {
                    "kind~1name": { "value~1name": { type: "number" } },
                    "kind/name": {
                        "value~1name": { type: "number" },
                        "value/name": { type: "string" }
                    }
                },
                properties: { child: { $ref: "#/propertyDependencies/kind~1name/value~1name" } }
            },
            options
        );
        assert.equal(node.validate({ child: "text" }).valid, true);
        assert.equal(node.validate({ child: 7 }).valid, false);
        const target = node.propertyDependencies?.["kind/name"]["value/name"];
        assert.equal(target?.evaluationPath, "#/propertyDependencies/kind~1name/value~1name");
        assert.equal(target?.schemaLocation, "#/propertyDependencies/kind~1name/value~1name");
    });

    it("encodes invalid property and value locations", () => {
        const node = compileSchema(
            { propertyDependencies: { "a/b": 7, "m~n": { "c%d 日本": 7 } } },
            options
        );
        assert.deepEqual(node.schemaErrors?.map(({ data }) => data.pointer), [
            "#/propertyDependencies/a~1b",
            "#/propertyDependencies/m~0n/c%25d%20%E6%97%A5%E6%9C%AC"
        ]);
    });
});
