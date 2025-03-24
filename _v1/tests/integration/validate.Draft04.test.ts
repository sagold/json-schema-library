import path from "path";
import fs from "fs";
import { strict as assert } from "assert";
import { expect } from "chai";
import { Draft04 as Core } from "../../lib/draft04";
import { JsonSchema, isJsonError } from "../../lib/types";

describe("validate.Draft04", () => {
    let schema: JsonSchema;
    let data: unknown;
    let draft: Core;

    beforeEach(() => {
        schema = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-schema.json"), "utf8")
        );
        data = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-data.json"), "utf8")
        );
        draft = new Core(schema);
    });

    it("should validate test-data by default", () => {
        const errors = draft.validate(data);

        expect(errors).to.have.length(0);
    });

    describe("resolveRef", () => {
        it("should discard any properties where $ref is used", () => {
            draft.rootSchema = { definitions: { def: { type: "string" } } };

            const result = draft.resolveRef(
                draft.createNode({ $ref: "#/definitions/def", title: "a definition" })
            );

            expect(result.schema).to.deep.equal({ type: "string" });
        });
    });

    describe("oneOf", () => {
        it("should return a matching schema", () => {
            const result = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [{ type: "string" }, { type: "number" }]
                }),
                5
            );
            expect(result.schema).to.deep.equal({ __oneOfIndex: 1, type: "number" });
        });

        it("should return an error if a matching schema could not be found", () => {
            const result = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [{ type: "string" }, { type: "number" }]
                }),
                []
            );

            assert(isJsonError(result));
            expect(result.type).to.eq("error");
            expect(result.name).to.eq("OneOfError");
        });

        it("should return an error if multiple schemas match the data", () => {
            const result = draft.resolveOneOf(
                draft.createNode({
                    oneOf: [
                        { type: "string" },
                        { type: "number", minimum: 2 },
                        { type: "number", minimum: 3 }
                    ]
                }),
                4
            );

            assert(isJsonError(result));
            expect(result.type).to.eq("error");
            expect(result.name).to.eq("MultipleOneOfError");
        });
    });
});
