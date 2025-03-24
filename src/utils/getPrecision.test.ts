import { strict as assert } from "assert";
import { getPrecision } from "./getPrecision";

describe("getPrecision", () => {
    it("should return decimal precision", () => {
        assert.equal(getPrecision(1.1), 1);
        assert.equal(getPrecision(0.12), 2);
        assert.equal(getPrecision(0.123), 3);
        assert.equal(getPrecision(123.4567), 4);
    });
});
