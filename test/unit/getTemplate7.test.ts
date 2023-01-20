/* eslint quote-props: 0 */
import { expect } from "chai";
import getTemplate from "../../lib/getTemplate";
import { Draft07 as Core } from "../../lib/draft07";

describe("getTemplate - v7", () => {
    let core: Core;
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

    describe("object", () => {
        describe("if-then-else", () => {
            it("should return template of then-schema for valid if-schema", () => {
                core.setSchema({
                    type: "object",
                    // note that required is necessary for getTemplate behaviour
                    required: ["test"],
                    properties: {
                        test: { type: "string", default: "with value" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 4 }
                        }
                    },
                    then: {
                        required: ["dynamic"],
                        properties: {
                            dynamic: { type: "string", default: "from then" }
                        }
                    }
                });

                const res = getTemplate(core);
                expect(res).to.deep.equal({
                    test: "with value",
                    dynamic: "from then"
                });
            });

            it("should not create data for then-schema if it is not required", () => {
                core.setSchema({
                    type: "object",
                    // note that required is necessary for getTemplate behaviour
                    required: ["test"],
                    properties: {
                        test: { type: "string", default: "with value" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 4 }
                        }
                    },
                    then: {
                        properties: {
                            dynamic: { type: "string", default: "from then" }
                        }
                    }
                });

                const res = getTemplate(core, undefined, core.getSchema(), {
                    addOptionalProps: false
                });
                expect(res).to.deep.equal({ test: "with value" });
            });

            it("should not return template of then-schema for invalid if-schema", () => {
                core.setSchema({
                    type: "object",
                    // note that required is necessary for getTemplate behaviour
                    required: ["test"],
                    properties: {
                        test: { type: "string", default: "too short" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 40 }
                        }
                    },
                    then: {
                        properties: {
                            dynamic: { type: "string", default: "from then" }
                        }
                    }
                });

                const res = getTemplate(core);
                expect(res).to.deep.equal({
                    test: "too short"
                });
            });

            it("should return template of else-schema for invalid if-schema", () => {
                core.setSchema({
                    type: "object",
                    // note that required is necessary for getTemplate behaviour
                    required: ["test"],
                    properties: {
                        test: { type: "string", default: "with test" }
                    },
                    if: {
                        properties: {
                            test: { type: "string", minLength: 40 }
                        }
                    },
                    then: {
                        required: ["dynamic"],
                        properties: {
                            dynamic: { type: "string", default: "from then" }
                        }
                    },
                    else: {
                        required: ["dynamic"],
                        properties: {
                            dynamic: { type: "string", default: "from else" }
                        }
                    }
                });

                const res = getTemplate(core);
                expect(res).to.deep.equal({
                    test: "with test",
                    dynamic: "from else"
                });
            });
        });
    });
});
