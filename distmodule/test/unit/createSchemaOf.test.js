import { expect } from "chai";
import createSchemaOf from "../../lib/createSchemaOf";
describe("createSchemaOf", () => {
    it("should add type 'object' of data to schema", () => {
        const res = createSchemaOf({});
        expect(res.type).to.eq("object");
    });
    it("should add type 'string' of data to schema", () => {
        const res = createSchemaOf("");
        expect(res).to.deep.eq({ type: "string" });
    });
    it("should should add object's properties", () => {
        const res = createSchemaOf({ first: "", second: {} });
        expect(res.properties).to.have.keys(["first", "second"]);
    });
    it("should add items from array", () => {
        const res = createSchemaOf(["string", false]);
        expect(res.items).to.have.length(2);
        expect(res.items[0].type).to.eq("string");
        expect(res.items[1].type).to.eq("boolean");
    });
    it("should add single item as item-object", () => {
        const res = createSchemaOf(["string"]);
        expect(res.items).to.be.an("object");
        expect(res.items).to.deep.eq({ type: "string" });
    });
});
