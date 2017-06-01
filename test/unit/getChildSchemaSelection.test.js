const expect = require("chai").expect;
const Core = require("../../lib/cores/JsonEditor");
const getChildSchemaSelection = require("../../lib/getChildSchemaSelection");


describe("getChildSchemaSelection", () => {

    let core;
    before(() => (core = new Core()));

    it("should return a single object-schema as list", () => {
        core.rootSchema = { type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        };

        const result = getChildSchemaSelection(core, core.rootSchema, "b");

        expect(result).to.have.length(1);
        expect(result[0]).to.eq(core.rootSchema.properties.b);
    });

    it("should return a single array-item as list", () => {
        core.rootSchema = { type: "array",
            items: [
                { type: "string" },
                { type: "number" }
            ]
        };

        const result = getChildSchemaSelection(core, core.rootSchema, 0);

        expect(result).to.have.length(1);
        expect(result[0]).to.eq(core.rootSchema.items[0]);
    });

    it("sould return list of oneOf elements", () => {
        core.rootSchema = { type: "array",
            items: {
                oneOf: [
                    { type: "string" },
                    { type: "number" }
                ]
            }
        };

        const result = getChildSchemaSelection(core, core.rootSchema, "b");

        expect(result).to.have.length(2);
        expect(result).to.deep.eq(core.rootSchema.items.oneOf);
    });
});
