import { expect } from "chai";
import { Draft07 as Draft } from "../../../lib/draft07";

describe("issue#43 - multipleOf .01", () => {
    let draft: Draft;
    beforeEach(() => {
        draft = new Draft({
            type: "number",
            multipleOf: 0.01
        });
    });

    it("should validate 1", () => {
        const result = draft.validate(1);
        expect(result).to.have.length(0);
    });

    it("should validate .2", () => {
        const result = draft.validate(0.2);
        expect(result).to.have.length(0);
    });

    it("should validate .02", () => {
        const result = draft.validate(0.02);
        expect(result).to.have.length(0);
    });

    it("should not validate .025", () => {
        const result = draft.validate(0.025);
        expect(result).to.have.length(1);
    });

    it("should validate 1.36", () => {
        const result = draft.validate(1.36);
        expect(result).to.have.length(0);
    });

    it("should validate 2.74", () => {
        const result = draft.validate(2.74);
        expect(result).to.have.length(0);
    });

    it("should validate 123456789", () => {
        const result = draft.validate(123456789);
        expect(result).to.have.length(0);
    });

    it("should not validate Infinity", () => {
        const result = draft.validate(1e308);
        expect(result).to.have.length(1);
    });

    it("should validate all floats with two decimals", () => {
        for (let i = 0; i <= 100; i++) {
            let num = `2.${i}`;
            expect(draft.validate(parseFloat(num))).to.have.length(
                0,
                `should have validated '${num}'`
            );
        }
    });

    it("should still validate multiple of integers", () => {
        draft = new Draft({
            type: "number",
            multipleOf: 3
        });
        const result = draft.validate(9);
        expect(result).to.have.length(0);
    });

    it("should still invalidate non-multiples of integers", () => {
        draft = new Draft({
            type: "number",
            multipleOf: 3
        });
        const result = draft.validate(7);
        expect(result).to.have.length(1);
    });
});
