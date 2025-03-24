import { expect } from "chai";
import { Draft06 } from "../../lib/draft06";

describe("compileV06", () => {
    let validator: Draft06;

    describe("01 - refRemote base URI change - base URI change ref invalid", () => {
        /*
            here we test if the root-pointer resolution of a remote definition is
            resolved within the remote schema - currently, it is not
            - references are resolved dynamically
            - so we return a schema, where the included reference is resolved later
            - which might resolve in wrong schema
         */
        beforeEach(() => {
            validator = new Draft06({
                $id: "http://localhost:1234/object",
                type: "object",
                properties: {
                    name: { $ref: "name.json#/definitions/orNull" }
                }
            });
            validator.addRemoteSchema("http://localhost:1234/name.json", {
                definitions: {
                    orNull: {
                        anyOf: [{ type: "null" }, { $ref: "#" }]
                    }
                },
                type: "string"
            });
        });

        it("should validate 'string'", () => {
            expect(validator.validate({ name: "foo" })).to.deep.eq([]);
        });

        it("should validate 'null'", () => {
            expect(validator.validate({ name: null })).to.deep.eq([], "null is valid");
        });

        it("should not validate 'object'", () => {
            expect(validator.isValid({ name: { name: null } })).to.eq(false);
        });
    });

    describe("02 - refRemote base URI change - base URI change ref invalid", () => {
        beforeEach(() => {
            validator = new Draft06({
                $id: "http://localhost:1234/",
                items: {
                    $id: "baseUriChange/",
                    items: { $ref: "folderInteger.json" }
                }
            });
            validator.addRemoteSchema("http://localhost:1234/baseUriChange/folderInteger.json", {
                type: "integer"
            });
        });

        it("should not validate 'string'", () => {
            expect(validator.isValid([["a"]])).to.eq(false, "string is invalid");
        });

        it("should validate 'number'", () => {
            expect(validator.isValid([[1]])).to.eq(true, "number is valid");
        });
    });
});
