/* eslint quote-props: 0 max-len: 0 */
const expect = require("chai").expect;
const resolveRef = require("../../lib/resolveRef.strict");


describe.only("resolveRef (strict)", () => {

    it("should return schema without $ref property", () => {
        const result = resolveRef({ $ref: "#/defs" }, { "defs": {} });

        expect(result).not.to.have.property("$ref");
    });

    it("should merge $ref target on schema-object", () => {
        const result = resolveRef({ $ref: "#/defs/a" }, { "defs": { a: { "type": "string" } } });

        expect(result).to.have.property("type");
        expect(result.type).to.eq("string");
    });

    it("should not modify schema", () => {
        const schema = { $ref: "#/defs/a" };
        const result = resolveRef(schema, { "defs": { a: { "type": "string" } } });

        expect(result).to.not.eq(schema);
        expect(schema).to.have.property("$ref");
    });

    it("should resolve nested $ref", () => {
        const schema = { $ref: "#/defs/b" };
        const result = resolveRef(schema, { "defs": { a: { "type": "string" }, b: { $ref: "#/defs/a" } } });

        expect(result).to.not.eq(schema);
        expect(schema).to.have.property("$ref");
        expect(result).to.have.property("type");
        expect(result.type).to.eq("string");
    });

    it("should resolve multiple nested $ref", () => {
        const schema = { $ref: "#/defs/c" };
        const result = resolveRef(schema, { "defs": {
            a: { "type": "string" },
            b: { $ref: "#/defs/a" },
            c: { $ref: "#/defs/b" }
        } });

        expect(result).to.not.eq(schema);
        expect(schema).to.have.property("$ref");
        expect(result).to.have.property("type");
        expect(result.type).to.eq("string");
    });
});
