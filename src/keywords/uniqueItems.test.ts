import { strict as assert } from "assert";

import { compileSchema } from "../compileSchema";

describe("keyword : uniqueItems : validate", () => {
    for (const [json, reordered, different] of [
        ['{"toString":"label","a":1}', '{"a":1,"toString":"label"}', '{"a":1,"toString":"other"}'],
        ['{"valueOf":1,"a":2}', '{"a":2,"valueOf":1}', '{"a":2,"valueOf":2}'],
        [
            '{"nested":[{"constructor":{"a":1,"b":2}}]}',
            '{"nested":[{"constructor":{"b":2,"a":1}}]}',
            '{"nested":[{"constructor":{"b":3,"a":1}}]}'
        ]
    ]) {
        it(`should detect duplicate JSON values with literal member names: ${json}`, () => {
            const node = compileSchema({ uniqueItems: true });
            const { valid, errors } = node.validate([JSON.parse(json), JSON.parse(reordered)], "#/list");

            assert.equal(valid, false);
            assert.equal(errors.length, 1);
            assert.equal(errors[0].code, "unique-items-error");
            assert.equal(errors[0].data.pointer, "#/list/1");
            assert.equal(errors[0].data.duplicatePointer, "#/list/0");
            assert.equal(errors[0].data.arrayPointer, "#/list");
            assert.equal(node.validate([JSON.parse(json), JSON.parse(different)]).valid, true);
        });
    }
});
