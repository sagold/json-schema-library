const expect = require("chai").expect;
const addValidator = require("../../lib/addValidator");
const Core = require("../../lib/cores/Draft04");

describe("addValidator", () => {

    let core;
    beforeEach(() => (core = new Core()));

    describe("error", () => {

        it("should throw an error for a missing creator function", () => {
            expect(() => addValidator.error(core, "123")).to.throw();
        });

        it("should overwrite 'minLengthError'", () => {
            addValidator.error(core, "minLengthError", data => ({
                type: "error",
                code: "custom-min-length-error",
                message: "my custom error message",
                data
            }));

            const result = core.validate("abc", { type: "string", minLength: 4 });

            expect(result).to.have.length(1);
            expect(result[0].code).to.eq("custom-min-length-error");
        });
    });

    describe("format", () => {

        it("should throw an error for a missing validation function", () => {
            expect(() => addValidator.format(core, "123")).to.throw();
        });

        it("should throw an error if the type is already specified", () => {
            addValidator.format(core, "123", Function.prototype);
            expect(() => addValidator.format(core, "123", Function.prototype)).to.throw();
        });

        it("should call custom format validator", () => {
            let called = false;

            addValidator.format(core, "id", () => {
                called = true;
            });

            core.validate("123-123", { type: "string", format: "id" });

            expect(called).to.eq(true);
        });

        it("should not call custom validator for a different format", () => {
            let called = false;

            addValidator.format(core, "id", () => {
                called = true;
            });

            core.validate("123-123", { type: "string", format: "string" });

            expect(called).to.eq(false);
        });

        it("should return error on failed format validation", () => {
            addValidator.format(core, "id", () => ({
                type: "error",
                code: "format-id-error"
            }));

            const result = core.validate("123-123", { type: "string", format: "id" });

            expect(result).to.have.length(1);
            expect(result[0].code).to.eq("format-id-error");
        });

        it("should return no error for successful validation", () => {
            addValidator.format(core, "id", () => true);

            const result = core.validate("123-123", { type: "string", format: "id" });

            expect(result).to.have.length(0);
        });
    });

    describe("keyword", () => {

        beforeEach(() => {
            if (core.validateKeyword.capitalized) {
                throw new Error("keyword 'capitalized' should not be set");
            }
        });

        it("should throw an error for a missing validation function", () => {
            expect(() => addValidator.keyword(core, "object", "123")).to.throw("Validation function expected");
        });

        it("should throw an error for unknown datatypes", () => {
            expect(() => addValidator.keyword(core, "error", "123", Function.prototype)).to.throw("Unknown datatype");
        });

        it("should allow to overwrite existing keyword validation", () => {
            expect(() => addValidator.keyword(core, "object", "enum", Function.prototype)).not.to.throw();
            expect(core.validateKeyword.enum).to.eq(Function.prototype);
        });

        it("should call custom keyword validator", () => {
            let called = false;
            addValidator.keyword(core, "string", "capitalized", () => (called = true));

            core.validate("myString", { type: "string", capitalized: true });

            expect(called).to.eq(true);
        });

        it("should not call validator if keyword is not set", () => {
            let called = false;
            addValidator.keyword(core, "string", "capitalized", () => (called = true));

            core.validate("myString", { type: "string" });

            expect(called).to.eq(false);
        });

        it("should not call custom keyword validator for different datatype", () => {
            let called = false;
            addValidator.keyword(core, "string", "capitalized", () => { called = true; });

            core.validate(1234, { type: "number", capitalized: true });

            expect(called).to.eq(false);
        });

        it("should return no error for successful validation", () => {
            addValidator.keyword(core, "string", "capitalized", (core, schema, value) => true);

            const result = core.validate("myString", { type: "string", capitalized: true });

            expect(result).to.have.length(0);
        });

        it("should return error on failed keyword validation", () => {
            addValidator.keyword(core, "string", "capitalized", (core, schema, value) => ({
                type: "error",
                code: "keyword-error"
            }));

            const result = core.validate("myString", { type: "string", capitalized: true });

            expect(result).to.have.length(1);
            expect(result[0].code).to.eq("keyword-error");
        });
    });
});
