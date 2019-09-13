/* eslint quote-props: 0 max-len: 0 */
const expect = require("chai").expect;
const resolveRef = require("../../lib/resolveRef.strict");
const addSchema = require("../../lib/addSchema");


describe("resolveRef (strict)", () => {

    it("should return schema without $ref property", () => {
        const result = resolveRef({ $ref: "#/defs" }, { "defs": {} });

        expect(result).not.to.have.property("$ref");
    });

    it("should return schema of json-pointer target", () => {
        const result = resolveRef({ $ref: "#/defs/a" }, { "defs": { a: { "type": "string" } } });

        expect(result).to.deep.eq({ "type": "string" });
    });

    it("should not modify schema", () => {
        const schema = { $ref: "#/defs/a" };
        const result = resolveRef(schema, { "defs": { a: { "type": "string" } } });

        expect(result).to.not.eq(schema);
        expect(schema).to.have.property("$ref");
    });

    it("should resolve all nested $ref", () => {
        const schema = {
            $ref: "#/definitions/c",
            definitions: {
                a: { type: "integer" },
                b: { $ref: "#/definitions/a" },
                c: { $ref: "#/definitions/b" }
            }
        };
        const result = resolveRef(schema, schema);

        expect(result).to.not.eq(schema);
        expect(schema).to.have.property("$ref");
        expect(result).to.have.property("type");
        expect(result.type).to.eq("integer");
    });

    describe("remotes", () => {
        const remotes = require("../../remotes");
        afterEach(() => remotes.reset());

        it("should resolve draft04 json per default", () => {
            const schema = { $ref: "http://json-schema.org/draft-04/schema#" };

            const result = resolveRef(schema, schema);

            expect(result).to.have.property("$schema");
            expect(result.$schema).to.eq("http://json-schema.org/draft-04/schema#");
        });

        it("should resolve remote remote schema", () => {
            addSchema("http://localhost:1234/name.json", require("json-schema-test-suite/remotes/name.json"));
            const schema = { $ref: "http://localhost:1234/name.json" };

            const result = resolveRef(schema, schema);

            expect(result).to.deep.eq(remotes["http://localhost:1234/name.json"]);
        });
    });
});
