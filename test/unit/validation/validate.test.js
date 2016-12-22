const expect = require("chai").expect;
const validate = require("../../../lib/validation/type").validate;


describe("validate", () => {

    describe("string", () => {

        it("should return MinLengthError if string is too short", () => {
            const errors = validate({ type: "string", minLength: 2 }, "a");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MinLengthError");
        });

        it("should return MaxLengthError if string is too short", () => {
            const errors = validate({ type: "string", maxLength: 2 }, "abc");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("MaxLengthError");
        });
    });
});
