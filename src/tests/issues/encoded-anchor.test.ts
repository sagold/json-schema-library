import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { isSchemaNode } from "../../types";

const cases = [
    ["draft-04", "id", "$ref"],
    ["draft-06", "$id", "$ref"],
    ["draft-07", "$id", "$ref"],
    ["draft-2019-09", "$anchor", "$ref"],
    ["draft-2020-12", "$anchor", "$ref"],
    ["draft-2020-12", "$dynamicAnchor", "$ref"],
    ["draft-2020-12", "$dynamicAnchor", "$dynamicRef"]
];

for (const [draft, anchorKeyword, refKeyword] of cases) {
    it(`resolves equivalent named anchors (${draft}, ${anchorKeyword}, ${refKeyword})`, () => {
        const uri = "https://example.test/anchors";
        const name = "node.value-_";
        const target = {
            [anchorKeyword]: anchorKeyword.endsWith("id") ? `#${name}` : name,
            type: "string",
            minLength: 2
        };
        for (const remote of [false, true]) {
            for (const fragment of ["#node.value-_", "#n%6Fde%2Evalue%2D%5F"]) {
                const schema = {
                    $schema: draft,
                    properties: { child: { [refKeyword]: `${remote ? uri : ""}${fragment}` } },
                    ...(remote ? {} : { definitions: { target } })
                };
                const node = compileSchema(schema);
                if (remote) {
                    node.addRemoteSchema(uri, { $schema: draft, definitions: { target } });
                }
                const reference = node.properties?.child;
                assert.ok(reference);
                const resolved = reference.resolveRef();
                assert.ok(isSchemaNode(resolved), fragment);
                assert.equal(resolved.type, "string");
                assert.deepEqual(
                    ["valid", 1, "x"].map((child) => node.validate({ child }).valid),
                    [true, false, false]
                );
            }
        }
    });
}
