/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import Draft07 from "../../../lib/cores/Draft07";
import addSchema from "../../../lib/draft07/addSchema";
import { addRemotes } from "../utils/addRemotes";
import TestSuite from "@json-schema-org/tests";
import draft07 from "../../../remotes/draft07.json";
import testId from "./tests/id.json";

addRemotes(addSchema);
addSchema("http://json-schema.org/draft-07/schema", draft07);

const testCases = TestSuite.draft7().filter(testcase => testcase.name.includes("refRemote"));

// https://json-schema.org/understanding-json-schema/structuring.html#id
// const testCases = [testId]

/*
  ✓ additionalItems,
  ✓ additionalProperties,
  ✓ allOf,
  ✓ anyOf,
  ✓ boolean_schema,
  ✓ const,
  ✓ contains,
  ✓ default,
  ✓ definitions - requires compiled draft-07 schema
  ✓ dependencies - added boolean
  ✓ enum,
  ✓ exclusiveMaximum' - added & adjusted
  ✓ exclusiveMinimum' - added & adjusted
  ✓ format,
  ✓ id - renamed schema.id to schema.$id
  ✖ if-then-else,
  ✓ infinite-loop-detection,
  ✓ items,
  ✓ maximum,
  ✓ maxItems,
  ✓ maxLength,
  ✓ maxProperties,
  ✓ minimum,
  ✓ minItems,
  ✓ minLength,
  ✓ minProperties,
  ✓ multipleOf,
  ✓ not,
  ✓ oneOf,
  optional/bignum,
  optional/content,
  optional/ecmascript-regex,
  optional/float-overflow,
  ✓ optional/format/date-time,
  optional/format/date,
  ✖ optional/format/email,
  ✖ optional/format/hostname,
  optional/format/idn-email,
  optional/format/idn-hostname,
  ✓ optional/format/ipv4,
  ✓ optional/format/ipv6,
  optional/format/iri-reference,
  optional/format/iri,
  optional/format/json-pointer,
  optional/format/regex,
  optional/format/relative-json-pointer,
  optional/format/time,
  optional/format/uri-reference,
  optional/format/uri-template,
  ✓ optional/format/uri,
  optional/non-bmp-regex,
  ✖ optional/unicode,
  ✓ pattern,
  ✓ patternProperties' - adjusted boolean schema: false
  ✓ properties,
  ✓ propertyNames' - add
  ✖ ✖ ref,
  ✖ refRemote,
  ✓ required,
  ✓ type,
  ✓ uniqueItems,
  ✖ unknownKeyword'
 */

function runTestCase(Core, tc, skipTest = []) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.schemas.forEach(testCase => {
            const schema = testCase.schema;
            if (skipTest.includes(testCase.description)) {
                console.log(chalk.red(`Unsupported '${testCase.description}'`));
                return;
            }

            describe(testCase.description, () => {
                testCase.tests.forEach(testData => {
                    const test = skipTest.includes(testData.description) ? it.skip : it;

                    test(testData.description, () => {
                        const validator = new Core(schema);
                        const isValid = validator.isValid(testData.data);
                        expect(isValid).to.eq(testData.valid);
                    });
                });
            });
        });
    });
}

export default function runAllTestCases(Core, skipTest = []) {
    describe("draft07", () => {
        testCases.forEach(testCase => runTestCase(Core, testCase, skipTest));
    });
}

runAllTestCases(Draft07);
