import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

// @todo investigate different requirements on joining url and id
// here json-schemer://schema + stock-assembly is joined to json-schemer://stock-assembly
// in joinId: const trailingFragments = /\/\/*$/; will fix this issue but fail spec tests
describe.skip("issue#82", () => {
    it("should return validation errors for number", () => {
        const schema = compileSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            type: "object",
            required: ["stock-assembly"],
            properties: {
                "stock-assembly": {
                    $ref: "stock-assembly"
                }
            },
            $id: "json-schemer://schema", // this works only if a trailing slash
            $defs: {
                "json-schemer://schema/stock-assembly": {
                    $schema: "http://json-schema.org/draft-07/schema#",
                    type: "object",
                    properties: {
                        $filter: {
                            type: "string",
                            title: "Фильтр"
                        }
                    },
                    $id: "json-schemer://schema/stock-assembly"
                }
            }
        });

        const { valid, errors } = schema.validate({
            "stock-assembly": 1
        });

        assert.equal(valid, false);
    });
});
