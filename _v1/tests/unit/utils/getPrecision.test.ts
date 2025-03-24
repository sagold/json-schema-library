import { expect } from "chai";
import { getPrecision } from "../../../lib/utils/getPrecision";

describe("getPrecision", () => {
    it("should return decimal precision", () => {
        expect(getPrecision(1.1)).to.equal(1);
        expect(getPrecision(0.12)).to.equal(2);
        expect(getPrecision(0.123)).to.equal(3);
        expect(getPrecision(123.4567)).to.equal(4);
    });
});
