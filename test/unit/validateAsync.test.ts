import { expect } from "chai";
import validateAsync from "../../lib/validateAsync";
import { Draft04 as Core } from "../../lib/draft04";
import addValidator from "../../lib/addValidator";
import { JSONError } from "../../lib/types";

describe("validateAsync", () => {
    let core: Core;
    before(() => (core = new Core()));

    it("should return a promise", () => {
        const promise = validateAsync(core, 4, { schema: { type: "number" } });
        expect(promise).to.be.instanceof(Promise);
    });

    it("should resolve successfull with an empty error", () =>
        validateAsync(core, 4, { schema: { type: "number" } }).then((errors) => {
            expect(errors).to.have.length(0);
        }));

    it("should resolve with errors for a failed validation", () =>
        validateAsync(core, "4", { schema: { type: "number" } }).then((errors) => {
            expect(errors).to.have.length(1);
            expect(errors[0].name).to.eq("TypeError");
        }));

    describe("onError", () => {
        before(() => {
            // adds an async validation helper to { type: 'string', asyncError: true }
            // @ts-ignore
            addValidator.keyword(core, "string", "asyncError", (c, schema) => {
                return schema.asyncError
                    ? new Promise((resolve) =>
                          // eslint-disable-next-line max-nested-callbacks
                          resolve({
                              type: "error",
                              name: "AsyncError",
                              code: "test-async-error",
                              message: "custom test error"
                          })
                      )
                    : Promise.resolve();
            });
        });

        it("should call onProgress immediately with error", () => {
            const errors: JSONError[] = [];
            return validateAsync(
                core,
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
            ).then(() => {
                expect(errors).to.have.length(2);
                expect(errors[0].name).to.eq("TypeError");
                expect(errors[1].name).to.eq("AsyncError");
            });
        });
    });
});
