import { strict as assert } from "node:assert";
import { compileSchema } from "../../dist/index.mjs";

const schema = compileSchema({ type: "string" });
const literal = schema.validate("");
assert(literal.errors.length === 0);

const number = schema.validate(1);
assert(number.errors.length === 1);
