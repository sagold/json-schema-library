const path = require("path");
const fs = require("fs");
const expect = require("chai").expect;
const Core = require("../../lib/cores/Draft04");


describe("validate.draft04", () => {
    let schema;
    let data;
    let core;

    beforeEach(() => {
        schema = JSON.parse(fs.readFileSync(path.join(__dirname, "support", "default-schema.json"), "utf8"));
        data = JSON.parse(fs.readFileSync(path.join(__dirname, "support", "default-data.json"), "utf8"));
        core = new Core(schema);
    });

    it("should validate data by default", () => {
        const errors = core.validate(schema, data);

        expect(errors).to.have.length(0);
    });
});
