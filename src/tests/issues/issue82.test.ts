import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";

describe("issue#82", () => {
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
            $id: "json-schemer://schema", // this works only for a trailing slash
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

        const { valid } = schema.validate({
            "stock-assembly": 1
        });

        assert.equal(valid, false);
    });

    it("should return validation error for initial example", () => {
        const schema = compileSchema({
            $schema: "https://json-schema.org/draft/2020-12/schema",
            type: "object",
            properties: {
                "1c_list_Document_СборкаЗапасов": {
                    $ref: "1c_list_Document_%D0%A1%D0%B1%D0%BE%D1%80%D0%BA%D0%B0%D0%97%D0%B0%D0%BF%D0%B0%D1%81%D0%BE%D0%B2"
                }
            },
            required: ["1c_list_Document_СборкаЗапасов"],
            $id: "json-schemer://schema",
            $defs: {
                "json-schemer://schema/1c_list_Document_%D0%A1%D0%B1%D0%BE%D1%80%D0%BA%D0%B0%D0%97%D0%B0%D0%BF%D0%B0%D1%81%D0%BE%D0%B2":
                    {
                        $schema: "http://json-schema.org/draft-07/schema#",
                        type: "object",
                        properties: {
                            $filter: {
                                type: "string",
                                title: "Фильтр"
                            }
                        },
                        $id: "json-schemer://schema/1c_list_Document_%D0%A1%D0%B1%D0%BE%D1%80%D0%BA%D0%B0%D0%97%D0%B0%D0%BF%D0%B0%D1%81%D0%BE%D0%B2"
                    }
            }
        });

        const { valid } = schema.validate({
            "1c_list_Document_СборкаЗапасов": 1
        });

        assert.equal(valid, false);
    });
});
