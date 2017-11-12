/* eslint quote-props: 0 max-len: 0 */
const expect = require("chai").expect;
const resolveRef = require("../../lib/resolveRef.strict");


describe("resolveRef (strict)", () => {

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
        // const precompile = require("../../lib/precompileSchema");

        afterEach(() => remotes.reset());


        it("should resolve draft04 json", () => {
            const schema = {
                $ref: "http://json-schema.org/draft-04/schema#"
            };

            const result = resolveRef(schema, schema);

            expect(result).to.have.property("$schema");
            expect(result.$schema).to.eq("http://json-schema.org/draft-04/schema#");
        });

        // it.only("should correctly resolve remote", () => {
        //     remotes["http://localhost:1234/name.json"] = require("json-schema-test-suite/remotes/name.json");
        //     const schema = precompile(null, {
        //         id: "http://localhost:1234/object",
        //         type: "object",
        //         properties: {
        //             name: { $ref: "name.json#/definitions/orNull" }
        //         }
        //     });
        //     console.log(schema);
        //     // "http://localhost:1234/name.json#/definitions/orNull"
        //     const result = resolveRef(schema.properties.name, schema);
        //     expect(result).to.deep.eq({ anyOf: [{ type: "null" }, { $ref: "#" }] });
        // });
    });
});
