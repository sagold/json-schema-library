import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import CSNSchema from "./csn-interop-effective.schema.json";

describe.only("issue#79 - csn ref resolution from defintions", () => {
    it("should compile as draft-07", () => {
        const node = compileSchema(CSNSchema);
        assert.equal(node.getDraftVersion(), "draft-07");
    });

    it("should have compiled definitions", () => {
        const node = compileSchema(CSNSchema);
        assert(node.$defs?.["@EndUserText.label"] != null);
    });

    it.skip("should resolve $ref '#/$defs/@EndUserText.label'", () => {
        const node = compileSchema(CSNSchema);
        const childSchema = node.getNodeRef("#/$defs/@EndUserText.label");
        assert(childSchema != null);
    });

    it.skip("should resolve $ref '#/definitions/@EndUserText.label'", () => {
        const node = compileSchema(CSNSchema);
        const childSchema = node.getNodeRef("#/definitions/@EndUserText.label");
        console.log("childSchema", childSchema);
        assert(childSchema != null);
    });

    it("should validate data", () => {
        const node = compileSchema(CSNSchema);
        const { valid } = node.validate({
            csnInteropEffective: "1.0",
            $version: "2.0",
            definitions: {
                BINRELID: {
                    "@EndUserText.label": "{i18n>BINRELID@ENDUSERTEXT.LABEL}",
                    kind: "type",
                    type: "cds.String",
                    length: 22
                }
            }
        });
        assert.equal(valid, true);
    });

    it("should invalidate data", () => {
        const node = compileSchema(CSNSchema);
        const { valid, errors } = node.validate({
            csnInteropEffective: "1.0",
            $version: "2.0",
            definitions: {
                BINRELID: {
                    "@EndUserText.label": false,
                    kind: "type",
                    type: "cds.String",
                    length: 22
                }
            }
        });

        assert.equal(valid, false);
        assert.equal(errors[0].code, "type-error");
        assert.equal(errors[0].data.pointer, "#/definitions/BINRELID/@EndUserText.label");
        // @todo: error is logged twice
        // assert.equal(errors.length, 1);
    });
});
