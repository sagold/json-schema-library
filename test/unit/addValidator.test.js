const expect = require("chai").expect;
const addValidator = require("../../lib/addValidator");
const Core = require("../../lib/cores/draft04");

describe.only("addValidator", () => {

    let core;
    beforeEach(() => (core = new Core()));

    describe("format", () => {

        it("should call custom format validator", () => {
            let called = false;

            addValidator.format(core, "id", () => {
                called = true;
            });

            core.validate({ type: "string", format: "id" }, "123-123");

            expect(called).to.eq(true);
        });

        it("should not call custom validator for a different format", () => {
            let called = false;

            addValidator.format(core, "id", () => {
                called = true;
            });

            core.validate({ type: "string", format: "string" }, "123-123");

            expect(called).to.eq(false);
        });

        it("should return error on failed format validation", () => {
            addValidator.format(core, "id", () => ({
                type: "error",
                code: "format-id-error"
            }));

            const result = core.validate({ type: "string", format: "id" }, "123-123");

            expect(result).to.have.length(1);
            expect(result[0].code).to.eq("format-id-error");
        });

        it("should return no error for successful validation", () => {
            addValidator.format(core, "id", () => true);

            const result = core.validate({ type: "string", format: "id" }, "123-123");

            expect(result).to.have.length(0);
        });
    });

    describe("keyword", () => {

        it("should call custom keyword validator", () => {
            let called = false;
            addValidator.keyword(core, "string", "capitalized", () => { called = true; });

            core.validate({ type: "string", capitalized: true }, "myString");

            expect(called).to.eq(true);
        });

        it("should not call custom keyword validator for different datatype", () => {
            let called = false;
            addValidator.keyword(core, "string", "capitalized", () => { called = true; });

            core.validate({ type: "number", capitalized: true }, 1234);

            expect(called).to.eq(false);
        });

        it("should return no error for successful validation", () => {
            addValidator.keyword(core, "string", "capitalized", (core, schema, value) => true);

            const result = core.validate({ type: "string", capitalized: true }, "myString");

            expect(result).to.have.length(0);
        });

        it("should return error on failed format validation", () => {
            addValidator.keyword(core, "string", "capitalized", (core, schema, value) => ({
                type: "error",
                code: "keyword-error"
            }));

            const result = core.validate({ type: "string", capitalized: true }, "myString");

            expect(result).to.have.length(1);
            expect(result[0].code).to.eq("keyword-error");
        });
    });
});
