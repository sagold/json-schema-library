// import { expect } from "chai";
// import addValidator from "../../lib/addValidator";
// import { Draft04 } from "../../lib/draft04";

// const nullFunc = () => {}; // eslint-disable-line

// describe("addValidator", () => {
//     let draft;
//     beforeEach(() => (draft = new Draft04()));

//     describe("error", () => {
//         it("should throw an error for a missing creator function", () => {
//             // @ts-ignore
//             expect(() => addValidator.error(draft, "123")).to.throw();
//         });

//         it("should overwrite 'minLengthError'", () => {
//             addValidator.error(draft, "minLengthError", (data) => ({
//                 type: "error",
//                 name: "minLengthError",
//                 // code: "custom-min-length-error",
//                 message: "my custom error message",
//                 data
//             }));

//             const result = draft.validate("abc", { type: "string", minLength: 4 });

//             expect(result).to.have.length(1);
//             expect(result[0].code).to.eq("custom-min-length-error");
//         });
//     });

//     describe("format", () => {
//         it("should throw an error for a missing validation function", () => {
//             // @ts-ignore
//             expect(() => addValidator.format(draft, "123")).to.throw();
//         });

//         it("should throw an error if the type is already specified", () => {
//             addValidator.format(draft, "123", nullFunc);
//             expect(() => addValidator.format(draft, "123", nullFunc)).to.throw();
//         });

//         it("should call custom format validator", () => {
//             let called = false;
//             addValidator.format(draft, "id", () => {
//                 called = true;
//             });

//             draft.validate("123-123", { type: "string", format: "id" });

//             expect(called).to.eq(true);
//         });

//         it("should not call custom validator for a different format", () => {
//             let called = false;
//             addValidator.format(draft, "id", () => {
//                 called = true;
//             });

//             draft.validate("123-123", { type: "string", format: "string" });

//             expect(called).to.eq(false);
//         });

//         it("should return error on failed format validation", () => {
//             addValidator.format(draft, "id", () => ({
//                 name: "test",
//                 type: "error",
//                 code: "format-id-error",
//                 message: "custom test error"
//             }));

//             const result = draft.validate("123-123", { type: "string", format: "id" });

//             expect(result).to.have.length(1);
//             expect(result[0].code).to.eq("format-id-error");
//         });

//         it("should return no error for successful validation", () => {
//             addValidator.format(draft, "id", () => undefined);

//             const result = draft.validate("123-123", { type: "string", format: "id" });

//             expect(result).to.have.length(0);
//         });
//     });

//     describe("keyword", () => {
//         beforeEach(() => {
//             if (draft.validateKeyword.capitalized) {
//                 throw new Error("keyword 'capitalized' should not be set");
//             }
//         });

//         it("should throw an error for a missing validation function", () => {
//             // @ts-ignore
//             expect(() => addValidator.keyword(draft, "object", "123")).to.throw(
//                 "Validation function expected"
//             );
//         });

//         it("should throw an error for unknown datatypes", () => {
//             expect(() => addValidator.keyword(draft, "error", "123", nullFunc)).to.throw(
//                 "Unknown datatype"
//             );
//         });

//         it("should allow to overwrite existing keyword validation", () => {
//             expect(() => addValidator.keyword(draft, "object", "enum", nullFunc)).not.to.throw();
//             expect(draft.validateKeyword.enum).to.eq(nullFunc);
//         });

//         it("should call custom keyword validator", () => {
//             let called = false;
//             addValidator.keyword(draft, "string", "capitalized", () => {
//                 called = true;
//                 return undefined;
//             });

//             draft.validate("myString", { type: "string", capitalized: true });

//             expect(called).to.eq(true);
//         });

//         it("should not call validator if keyword is not set", () => {
//             let called = false;
//             addValidator.keyword(draft, "string", "capitalized", () => {
//                 called = true;
//                 return undefined;
//             });

//             draft.validate("myString", { type: "string" });

//             expect(called).to.eq(false);
//         });

//         it("should not call custom keyword validator for different datatype", () => {
//             let called = false;
//             addValidator.keyword(draft, "string", "capitalized", () => {
//                 called = true;
//                 return undefined;
//             });

//             draft.validate(1234, { type: "number", capitalized: true });

//             expect(called).to.eq(false);
//         });

//         it("should return no error for successful validation", () => {
//             addValidator.keyword(draft, "string", "capitalized", (draft, schema, value) => undefined);

//             const result = draft.validate("myString", { type: "string", capitalized: true });

//             expect(result).to.have.length(0);
//         });

//         it("should return error on failed keyword validation", () => {
//             addValidator.keyword(draft, "string", "capitalized", (draft, schema, value) => ({
//                 name: "test",
//                 type: "error",
//                 code: "keyword-error",
//                 message: "custom test error"
//             }));

//             const result = draft.validate("myString", { type: "string", capitalized: true });

//             expect(result).to.have.length(1);
//             expect(result[0].code).to.eq("keyword-error");
//         });
//     });
// });
