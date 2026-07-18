import { strict as assert } from "assert";
import { compileSchema } from "../../compileSchema";
import { draft07 } from "../../draft07";
import { extendDraft } from "../../Draft";
import { addFormats } from "../../formats/additionalFormats";

// copy drafts and add additional  format validators to them (ip4 format validator)
const drafts = [draft07].map((draft) => extendDraft(draft, {}));
addFormats(drafts);

// issue#113 — ipv4 format validator rejected valid addresses whose first octet
// is "0" (e.g. 0.0.0.0). The guard meant to reject leading-zero *octets*
// (octal-looking, e.g. 01.2.3.4), not any address starting with "0".
describe("issue#113 - ipv4 format rejects valid 0.0.0.0 (over-broad leading-zero guard)", () => {
    it("accepts 0.0.0.0 as a valid ipv4 address", () => {
        const node = compileSchema({ $schema: "draft-07", format: "ipv4" }, { drafts });
        const { errors } = node.validate("0.0.0.0");
        assert.equal(errors?.length ?? 0, 0, "0.0.0.0 should be valid");
    });

    it("accepts 127.0.0.1 as a valid ipv4 address", () => {
        const node = compileSchema({ $schema: "draft-07", format: "ipv4" }, { drafts });
        const { errors } = node.validate("127.0.0.1");
        assert.equal(errors?.length ?? 0, 0, "127.0.0.1 should be valid");
    });

    it("rejects 01.2.3.4 (leading zero in an octet, octal-like)", () => {
        const node = compileSchema({ $schema: "draft-07", format: "ipv4" }, { drafts });
        const { errors } = node.validate("01.2.3.4");
        assert.notEqual(errors?.length ?? 0, 0, "01.2.3.4 should be rejected");
    });
});
