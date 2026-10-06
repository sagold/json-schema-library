import { strict as assert } from "assert";
import { compileSchema } from "./compileSchema";
import { isJsonError } from "./types";

const target = { definitions: { target: { type: "string" } }, $ref: "#/definitions/target" };

describe("reference conditional siblings", () => {
    for (const draft of ["draft-04", "draft-06", "draft-07"]) {
        it(`ignores then and else beside a reference (${draft})`, () => {
            for (const condition of [true, false]) {
                const node = compileSchema({
                    $schema: draft, ...target, if: condition, then: false, else: false
                });
                assert.equal(node.validate("ok").valid, true);
                assert.equal(node.validate(1).valid, false);
                assert.equal(node.resolveRef().type, "string");
                assert.equal(node.if, undefined);
                assert.equal(node.then, undefined);
                assert.equal(node.else, undefined);
            }
        });

        it(`does not expose ignored missing conditional targets (${draft})`, () => {
            const node = compileSchema({
                $schema: draft, ...target, if: true,
                then: { $ref: "#/definitions/missing" }, else: { $ref: "#/definitions/also-missing" }
            });
            assert.equal(node.toSchemaNodes().some((child) => child !== node && child.schema.$ref != null), false);
            assert.ok(node.$defs?.target);
            assert.equal(node.validate("ok").valid, true);
            assert.equal(node.validate(1).valid, false);
        });
    }

    for (const draft of ["draft-2019-09", "draft-2020-12"]) {
        it(`continues applying conditional siblings and exposing their references (${draft})`, () => {
            for (const condition of [true, false]) {
                const node = compileSchema({
                    $schema: draft, ...target, if: condition,
                    then: { minLength: 3 }, else: { minLength: 3 }
                });
                assert.deepEqual(["ok", "long", 1].map((value) => node.validate(value).valid), [false, true, false]);
            }
            const missing = compileSchema({
                $schema: draft, ...target, if: true, then: { $ref: "#/definitions/missing" }
            });
            assert.ok(missing.then);
            assert.ok(missing.toSchemaNodes().includes(missing.then));
            assert.ok(isJsonError(missing.then.resolveRef()));
            assert.equal(missing.validate("ok").valid, false);
        });
    }
});
