import { expect } from "chai";
import merge from "../../../lib/utils/merge";

describe("merge", () => {
    it("should merge objects", () => {
        const res = merge<{ a: number; b: number }>({ a: 1 }, { b: 2 });

        expect(res).to.deep.equal({ a: 1, b: 2 });
    });

    it("should replace arrays", () => {
        const res = merge([1, 2], [3]);

        expect(res).to.deep.equal([3]);
    });

    it("should not modify input values", () => {
        const a = { a: 1 };
        const b = { b: 2 };

        merge<{ a: number; b: number }>(a, b);

        expect(a).to.deep.equal({ a: 1 });
        expect(b).to.deep.equal({ b: 2 });
    });
});
