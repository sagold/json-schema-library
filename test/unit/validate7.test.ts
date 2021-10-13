import { expect } from "chai";
import validate from "../../lib/validate";
import Core from "../../lib/cores/Draft07";
// import remotes from "../../remotes";


describe("validate draft07", () => {

    let core;
    before(() => (core = new Core()));

    describe("integer", () => {

        describe("exclusiveMaximum", () => {
            it("should fail if value is equal to 0", () => {
                expect(validate(core, 0, { exclusiveMaximum: 0 })).to.have.length(1);
            });

            it("should succeed if value is below to 0", () => {
                expect(validate(core, -1, { exclusiveMaximum: 0 })).to.have.length(0);
            });
        });

        describe("exclusiveMinimum", () => {
            it("should fail if value is equal to 0", () => {
                expect(validate(core, 0, { exclusiveMinimum: 0 })).to.have.length(1);
            });

            it("should succeed if value is above to 0", () => {
                expect(validate(core, 1, { exclusiveMinimum: 0 })).to.have.length(0);
            });
        });

        describe("if-then-else", () => {
            it("should validate if-then constructs", () => {
                const schema = {
                    if: { exclusiveMaximum: 0 }, // if this schema matches
                    then: { minimum: -10 } // also test this schema
                };
                expect(validate(core, -1, schema)).to.have.length(0, "valid through then");
                expect(validate(core, -100, schema)).to.have.length(1, "invalid through then");
                expect(validate(core, 3, schema)).to.have.length(0, "valid when if test fails");
            });

            it("should validate if-else constructs", () => {
                const schema = {
                    if: { exclusiveMaximum: 0 }, // valid if 'if' valid
                    else: { multipleOf: 2 } // test if 'if' fails
                };
                expect(validate(core, -1, schema)).to.have.length(0, "valid when if test passes");
                expect(validate(core, 4, schema)).to.have.length(0, "valid through else");
                expect(validate(core, 3, schema)).to.have.length(1, "invalid through else");
            })
        });
    });
});
