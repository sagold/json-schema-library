const path = require("path");
const fs = require("fs");
const expect = require("chai").expect;
const Core = require("../../lib/cores/JsonEditor");


describe("validate.JsonEditor", () => {
    let schema;
    let data;
    let core;

    beforeEach(() => {
        schema = JSON.parse(fs.readFileSync(path.join(__dirname, "support", "default-schema.json"), "utf8"));
        data = JSON.parse(fs.readFileSync(path.join(__dirname, "support", "default-data.json"), "utf8"));
        core = new Core(schema);
    });

    it("should validate test-data by default", () => {
        const errors = core.validate(schema, data);

        expect(errors).to.have.length(0);
    });

    describe("resolveRef", () => {

        it("should merge any properties where $ref is used", () => {
            core.rootSchema = { definitions: { def: { type: "string" } } };
            const result = core.resolveRef({ $ref: "#/definitions/def", title: "a definition" });
            expect(result).to.deep.equal({ type: "string", title: "a definition" });
        });
    });

    describe("oneOf", () => {

        it("should return a matching schema", () => {
            const result = core.resolveOneOf(
                {
                    oneOf: [
                        { type: "string" },
                        { type: "number" }
                    ]
                },
                5
            );
            expect(result).to.deep.equal({ type: "number" });
        });

        it("should return an error if a matching schema could not be found", () => {
            const result = core.resolveOneOf(
                {
                    oneOf: [
                        { type: "string" },
                        { type: "number" }
                    ]
                },
                []
            );
            expect(result).to.be.instanceof(Error);
            expect(result.name).to.eq("OneOfError");
        });

        it("should return an error if multiple schemas match the data", () => {
            const result = core.resolveOneOf(
                {
                    oneOf: [
                        { type: "string" },
                        { type: "number", minimum: 2 },
                        { type: "number", minimum: 3 }
                    ]
                },
                4
            );
            expect(result).to.be.instanceof(Error);
            expect(result.name).to.eq("MultipleOneOfError");
        });
    });
});
