import { expect } from "chai";
import { JsonEditor as Core } from "../../lib/jsoneditor";
import getChildSchemaSelection from "../../lib/getChildSchemaSelection";

describe("getChildSchemaSelection", () => {
    let draft: Core;
    before(() => (draft = new Core()));

    it("should return a single object-schema as list", () => {
        const result = getChildSchemaSelection(draft, "b", {
            type: "object",
            properties: {
                a: { type: "string" },
                b: { type: "number" }
            }
        });

        expect(result).to.have.length(1);
        expect(result).to.deep.eq([{ type: "number" }]);
    });

    it("should return a single array-item as list", () => {
        const result = getChildSchemaSelection(draft, 0, {
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });

        expect(result).to.have.length(1);
        expect(result).to.deep.eq([{ type: "string" }]);
    });

    it("should return an empty array if items schema is undefined", () => {
        const result = getChildSchemaSelection(draft, 2, {
            type: "array",
            items: [{ type: "string" }, { type: "number" }]
        });

        expect(result).to.have.length(0);
    });

    it("should return list of oneOf elements", () => {
        const result = getChildSchemaSelection(draft, "b", {
            type: "array",
            items: {
                oneOf: [{ type: "string" }, { type: "number" }]
            }
        });

        expect(result).to.have.length(2);
        expect(result).to.deep.eq([{ type: "string" }, { type: "number" }]);
    });

    it("should resolve items from oneOf elements", () => {
        // @note: ref resolution requires a compiled schema
        draft.setSchema({
            type: "array",
            items: {
                oneOf: [{ $ref: "#/definitions/string" }, { $ref: "#/definitions/number" }]
            },
            definitions: {
                number: { type: "number" },
                string: { type: "string" }
            }
        });

        const result = getChildSchemaSelection(draft, "b", draft.getSchema());

        expect(result).to.have.length(2);
        expect(result).to.deep.eq([{ type: "string" }, { type: "number" }]);
    });

    describe("additionalItems", () => {
        it("should return empty list if additionalItems is false", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: false
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(0);
        });

        it("should return empty list if additionalItems is undefined", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: undefined
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(0);
        });

        it("should return string-schema if additionalItems is true", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: true
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(1);
            expect(result).to.deep.eq([{ type: "string" }]);
        });

        it("should return additionalItem schema", () => {
            draft.setSchema({
                type: "array",
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(1);
            expect(result).to.deep.eq([{ id: "number", type: "number", default: 2 }]);
        });

        it("should return additionalItem schema when items-list is exceeded", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "string" }],
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(1);
            expect(result).to.deep.eq([{ id: "number", type: "number", default: 2 }]);
        });

        it("should return items-schema instead of additionalItems if item is defined", () => {
            draft.setSchema({
                type: "array",
                items: [{ type: "string" }, { type: "string" }],
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(1);
            expect(result).to.deep.eq([{ type: "string" }]);
        });

        it("should not return additionalItems if item-schema is object", () => {
            draft.setSchema({
                type: "array",
                items: { type: "string" },
                additionalItems: { id: "number", type: "number", default: 2 }
            });

            const result = getChildSchemaSelection(draft, 1, draft.getSchema());

            expect(result).to.have.length(1);
            expect(result).to.deep.eq([{ type: "string" }]);
        });
    });
});
