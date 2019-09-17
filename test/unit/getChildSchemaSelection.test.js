const expect = require("chai").expect;
const Core = require("../../lib/cores/JsonEditor");
const getChildSchemaSelection = require("../../lib/getChildSchemaSelection");


describe("getChildSchemaSelection", () => {

    let core;
    before(() => (core = new Core()));

    it("should return a single object-schema as list", () => {
        const result = getChildSchemaSelection(core, "b", {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        });

        expect(result).to.have.length(1);
        expect(result).to.deep.eq([{ type: "number" }]);
    });

    it("should return a single array-item as list", () => {
        const result = getChildSchemaSelection(core, 0, {
            type: "array",
            items: [
                { type: "string" },
                { type: "number" }
            ]
        });

        expect(result).to.have.length(1);
        expect(result).to.deep.eq([{ type: "string" }]);
    });

    it("sould return list of oneOf elements", () => {
        const result = getChildSchemaSelection(core, "b", {
            type: "array",
            items: {
                oneOf: [
                    { type: "string" },
                    { type: "number" }
                ]
            }
        });

        expect(result).to.have.length(2);
        expect(result).to.deep.deep.eq([
            { type: "string" },
            { type: "number" }
        ]);
    });
});
