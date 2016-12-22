const expect = require("chai").expect;
const validate = require("../../../lib/validation/type").validate;


describe("validate", () => {

    describe.only("string", () => {

        it("should return minLengthError if string is too short", () => {
            const errors = validate({ type: "string", minLength: 2 }, "a");
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("minLengthError");

            throw errors[0];
        });
    });
});
