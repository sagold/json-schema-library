/* eslint quote-props: 0 */
import { expect } from "chai";
import getTemplate from "../../lib/getTemplate";
import { Draft07 as Core } from "../../lib/draft07";

describe("getTemplate - v7", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    it("should set default as value", () => {
        draft.setSchema({ type: "string", default: "static" });
        const res = getTemplate(draft);

        expect(res).to.deep.equal("static");
    });

    it("should set const as value", () => {
        draft.setSchema({ const: "static" });
        const res = getTemplate(draft);

        expect(res).to.deep.equal("static");
    });

    it("should prefer const over default", () => {
        draft.setSchema({ type: "string", const: "static", default: "should be overwritten" });
        const res = getTemplate(draft);

        expect(res).to.deep.equal("static");
    });

    describe("object", () => {
        describe("if-then-else", () => {
            it("should return template of then-schema for valid if-schema", () => {
                draft.setSchema({
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

                const res = getTemplate(draft);
                expect(res).to.deep.equal({
                    test: "with value",
                    dynamic: "from then"
                });
            });

            it("should not create data for then-schema if it is not required", () => {
                draft.setSchema({
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

                const res = getTemplate(draft, undefined, draft.getSchema(), {
                    addOptionalProps: false
                });
                expect(res).to.deep.equal({ test: "with value" });
            });

            it("should not return template of then-schema for invalid if-schema", () => {
                draft.setSchema({
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

                const res = getTemplate(draft);
                expect(res).to.deep.equal({
                    test: "too short"
                });
            });

            it("should return template of else-schema for invalid if-schema", () => {
                draft.setSchema({
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

                const res = getTemplate(draft);
                expect(res).to.deep.equal({
                    test: "with test",
                    dynamic: "from else"
                });
            });
        });
    });
});
