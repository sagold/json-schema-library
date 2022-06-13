/* eslint quote-props: 0 */
import { expect } from "chai";
import getTemplate from "../../lib/getTemplate";
import Core from "../../lib/cores/Draft07";

describe("getTemplate - v7", () => {

    let core;
    before(() => (core = new Core()));

    it("should set default as value", () => {
        core.setSchema({ type: "string", default: "static" });
        const res = getTemplate(core);

        expect(res).to.deep.equal("static");
    });

    it("should set const as value", () => {
        core.setSchema({ const: "static" });
        const res = getTemplate(core);

        expect(res).to.deep.equal("static");
    });

    it("should prefer const over default", () => {
        core.setSchema({ type: "string", const: "static", default: "should be overwritten" });
        const res = getTemplate(core);

        expect(res).to.deep.equal("static");
    });
});
