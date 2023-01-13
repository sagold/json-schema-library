import { expect } from "chai";
import { Draft07 as Draft } from "../../lib/draft07";
import { reduceSchema } from "../../lib/reduceSchema";

describe("reduceSchema", () => {
    describe("dependencies", () => {
        it("should merge array-dependencies to required", () => {
            const draft = new Draft();
            const schema = reduceSchema(
                draft,
                {
                    type: "object",
                    required: ["one"],
                    properties: {
                        one: { type: "string" },
                        two: { type: "string" }
                    },
                    dependencies: {
                        one: ["two"]
                    }
                },
                { one: "" }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["one", "two"],
                properties: {
                    one: { type: "string" },
                    two: { type: "string" }
                }
            });
        });
        it("should not merge array-dependencies if dependency is not met", () => {
            const draft = new Draft();
            const schema = reduceSchema(
                draft,
                {
                    type: "object",
                    required: [],
                    properties: {
                        one: { type: "string" },
                        two: { type: "string" }
                    },
                    dependencies: {
                        one: ["two"]
                    }
                },
                {}
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: [],
                properties: {
                    one: { type: "string" },
                    two: { type: "string" }
                }
            });
        });
    });

    describe("if-then--else", () => {
        it("should merge if-then-else schema", () => {
            const draft = new Draft();
            const schema = reduceSchema(
                draft,
                {
                    type: "object",
                    required: ["one"],
                    properties: {
                        one: { type: "string" }
                    },
                    if: {
                        minProperties: 1
                    },
                    then: {
                        required: ["two"],
                        properties: {
                            two: { type: "string" }
                        }
                    }
                },
                { one: "" }
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["one", "two"],
                properties: {
                    one: { type: "string" },
                    two: { type: "string" }
                }
            });
        });
        it("should not merge then schema when if does not validate", () => {
            const draft = new Draft();
            const schema = reduceSchema(
                draft,
                {
                    type: "object",
                    required: ["one"],
                    properties: {
                        one: { type: "string" }
                    },
                    if: {
                        minProperties: 1
                    },
                    then: {
                        required: ["two"],
                        properties: {
                            two: { type: "string" }
                        }
                    }
                },
                {}
            );
            expect(schema).to.deep.equal({
                type: "object",
                required: ["one"],
                properties: {
                    one: { type: "string" }
                }
            });
        });
    });
});
