const expect = require("chai").expect;
const Core = require("../../lib/cores/Draft04");


describe("$ref", () => {
    let core;
    beforeEach(() => (core = new Core()));

    it("should resolve location-independent identifier", () => {
        const schema = {
            allOf: [{
                $ref: "#foo"
            }],
            definitions: {
                A: {
                    id: "#foo",
                    type: "integer"
                }
            }
        };

        core.setSchema(schema);

        expect(core.validate(schema, 1).length).to.eq(0);
        expect(core.validate(schema, "a").length).to.eq(1);
    });

    it("should resolve location-independent identifier with base URI change in subschema", () => {
        const schema = {
            id: "http://localhost:1234/root",
            allOf: [{
                $ref: "http://localhost:1234/nested.json#foo"
            }],
            definitions: {
                A: {
                    id: "nested.json",
                    definitions: {
                        B: {
                            id: "#foo",
                            type: "integer"
                        }
                    }
                }
            }
        };

        core.setSchema(schema);

        expect(core.validate(schema, 1).length).to.eq(0, "should not validate number");
        expect(core.validate(schema, "a").length).to.eq(1, "should not validate string");
    });
});
