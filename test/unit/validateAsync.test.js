const expect = require("chai").expect;
const validateAsync = require("../../lib/validateAsync");
const Core = require("../../lib/cores/draft04");


describe("validateAsync", () => {

    let core;
    before(() => (core = new Core()));

    it("should return a promise", () => {
        const promise = validateAsync(core, { type: "number" }, 4);
        expect(promise).to.be.instanceof(Promise);
    });

    it("should resolve successfull with an empty error", () => validateAsync(core, { type: "number" }, 4)
        .then((errors) => {
            expect(errors).to.have.length(0);
        }
    ));

    it("should resolve with errors for a failed validation", () => validateAsync(core, { type: "number" }, "4")
        .then((errors) => {
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        }
    ));
});
