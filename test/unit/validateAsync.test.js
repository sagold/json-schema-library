const expect = require("chai").expect;
const validateAsync = require("../../lib/validateAsync");
const Core = require("../../lib/cores/Draft04");
const addValidator = require("../../lib/addValidator");


describe("validateAsync", () => {

    let core;
    before(() => (core = new Core()));

    it("should return a promise", () => {
        const promise = validateAsync(core, 4, { schema: { type: "number" } });
        expect(promise).to.be.instanceof(Promise);
    });

    it("should resolve successfull with an empty error", () =>
        validateAsync(core, 4, { schema: { type: "number" } })
        .then((errors) => {
            expect(errors).to.have.length(0);
        }
    ));

    it("should resolve with errors for a failed validation", () =>
        validateAsync(core, "4", { schema: { type: "number" }})
        .then((errors) => {
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        }
    ));


    describe("onError", () => {

        before(() => {
            // adds an async validation helper to { type: 'string', asyncError: true }
            addValidator.keyword(core, "string", "asyncError", (c, schema) => { // eslint-disable-line arrow-body-style
                return schema.asyncError ? new Promise((resolve) =>
                    // eslint-disable-next-line max-nested-callbacks
                    setTimeout(() => resolve({ type: "error", name: "AsyncError" }), 25)
                ) : Promise.resolve();
            });
        });

        it("should call onProgress immediately with error", () => {
            const errors = [];
            return validateAsync(core,
                    {
                        async: "test async progres",
                        anotherError: 44
                    },
                    {
                        schema: {
                            type: "object",
                            properties: {
                                async: { type: "string", asyncError: true },
                                anotherError: { type: "string" }
                            }
                        },
                        onError: (err) => errors.push(err)
                    }
                )
                .then(() => {
                    expect(errors).to.have.length(2);
                    expect(errors[0].name).to.eq("TypeError");
                    expect(errors[1].name).to.eq("AsyncError");
                });
        });
    });
});
