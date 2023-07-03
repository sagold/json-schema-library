import { expect } from "chai";
import validate from "../../lib/validate";
import { Draft07 as Core } from "../../lib/draft07";
// import remotes from "../../remotes";

describe("validate draft07", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    describe("integer", () => {
        describe("exclusiveMaximum", () => {
            it("should fail if value is equal to 0", () => {
                expect(validate(draft, 0, { exclusiveMaximum: 0 })).to.have.length(1);
            });

            it("should succeed if value is below to 0", () => {
                expect(validate(draft, -1, { exclusiveMaximum: 0 })).to.have.length(0);
            });
        });

        describe("exclusiveMinimum", () => {
            it("should fail if value is equal to 0", () => {
                expect(validate(draft, 0, { exclusiveMinimum: 0 })).to.have.length(1);
            });

            it("should succeed if value is above to 0", () => {
                expect(validate(draft, 1, { exclusiveMinimum: 0 })).to.have.length(0);
            });
        });

        describe("if-then-else", () => {
            it("should validate if-then constructs", () => {
                const schema = {
                    if: { exclusiveMaximum: 0 }, // if this schema matches
                    then: { minimum: -10 } // also test this schema
                };
                expect(validate(draft, -1, schema)).to.have.length(0, "valid through then");
                expect(validate(draft, -100, schema)).to.have.length(1, "invalid through then");
                expect(validate(draft, 3, schema)).to.have.length(0, "valid when if test fails");
            });

            it("should validate if-else constructs", () => {
                const schema = {
                    if: { exclusiveMaximum: 0 }, // valid if 'if' valid
                    else: { multipleOf: 2 } // test if 'if' fails
                };
                expect(validate(draft, -1, schema)).to.have.length(0, "valid when if test passes");
                expect(validate(draft, 4, schema)).to.have.length(0, "valid through else");
                expect(validate(draft, 3, schema)).to.have.length(1, "invalid through else");
            });
        });
    });

    describe("object", () => {
        describe("dependencies", () => {
            it("should return correct error for invalid dependency", () => {
                const errors = validate(
                    draft,
                    {
                        nested: {
                            test: "with then",
                            dynamic: ""
                        }
                    },
                    {
                        type: "object",
                        properties: {
                            nested: {
                                type: "object",
                                properties: {
                                    test: {
                                        type: "string"
                                    }
                                },
                                dependencies: {
                                    test: {
                                        required: ["dynamic"],
                                        properties: {
                                            dynamic: {
                                                type: "string",
                                                minLength: 1
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                );
                expect(errors).to.have.length(1, "should have returned an error");
                expect(errors[0].data.pointer).to.equal("#/nested/dynamic");
            });
        });
    });
});
