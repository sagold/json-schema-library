const expect = require("chai").expect;
const Core = require("../../lib/cores/JsonEditor");
const getChildSchemaSelection = require("../../lib/getChildSchemaSelection");


describe("getChildSchemaSelection", () => {

    let core;
    before(() => (core = new Core()));

    it("should return a single object-schema as list", () => {
        const schema = { type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        };

        const result = getChildSchemaSelection(core, schema, "b");

        expect(result).to.have.length(1);
        expect(result[0]).to.eq(schema.properties.b);
    });

    it("should return a single array-item as list", () => {
        const schema = { type: "array",
            items: [
                { type: "string" },
                { type: "number" }
            ]
        };

        const result = getChildSchemaSelection(core, schema, 0);

        expect(result).to.have.length(1);
        expect(result[0]).to.eq(schema.items[0]);
    });

    it("sould return list of oneOf elements", () => {
        const schema = { type: "array",
            items: {
                oneOf: [
                    { type: "string" },
                    { type: "number" }
                ]
            }
        };

        const result = getChildSchemaSelection(core, schema, "b");

        expect(result).to.have.length(2);
        expect(result).to.deep.eq(schema.items.oneOf);
    });
});
