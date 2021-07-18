/* eslint max-len: 0 */
import { expect } from "chai";
import chalk from "chalk";
import path from "path";
import glob from "glob";
import Draft07 from "../../../lib/cores/Draft07";
import addSchema from "../../../lib/draft07/addSchema";
import { addRemotes } from "../utils/addRemotes";
import flattenArray from "../../../lib/utils/flattenArray";

addRemotes(addSchema);

// fetch TestCases
const globPattern = path.join(__dirname, "..", "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft7", "**", "*.json");
let draft07TestCases = glob.sync(globPattern);
if (draft07TestCases.length === 0) {
    throw new Error(`Failed retrieving tests from ${globPattern}`);
}

draft07TestCases = draft07TestCases.filter(filepath => filepath.includes("/propertyNames.json"));

/*
  ✓ 'tests/draft7/additionalItems.json',
  ✓ 'tests/draft7/additionalProperties.json',
  ✓ 'tests/draft7/allOf.json',
  ✓ 'tests/draft7/anyOf.json',
  ✓ 'tests/draft7/boolean_schema.json',
  ✖ 'tests/draft7/const.json',
  ✖ 'tests/draft7/contains.json',
  ✓ 'tests/draft7/default.json',
  ✖ 'tests/draft7/definitions.json',
  ✖ 'tests/draft7/dependencies.json',
  ✓ 'tests/draft7/enum.json',
  ✓ 'tests/draft7/exclusiveMaximum.json' - added & adjusted
  ✓ 'tests/draft7/exclusiveMinimum.json' - added & adjusted
  ✓ 'tests/draft7/format.json',
  ✖ 'tests/draft7/id.json',
  ✖ 'tests/draft7/if-then-else.json',
  ✓ 'tests/draft7/infinite-loop-detection.json',
  ✓ 'tests/draft7/items.json',
  ✓ 'tests/draft7/maximum.json',
  ✓ 'tests/draft7/maxItems.json',
  ✓ 'tests/draft7/maxLength.json',
  ✓ 'tests/draft7/maxProperties.json',
  ✓ 'tests/draft7/minimum.json',
  ✓ 'tests/draft7/minItems.json',
  ✓ 'tests/draft7/minLength.json',
  ✓ 'tests/draft7/minProperties.json',
  ✓ 'tests/draft7/multipleOf.json',
  ✓ 'tests/draft7/not.json',
  ✓ 'tests/draft7/oneOf.json',
  'tests/draft7/optional/bignum.json',
  'tests/draft7/optional/content.json',
  'tests/draft7/optional/ecmascript-regex.json',
  'tests/draft7/optional/float-overflow.json',
  'tests/draft7/optional/format/date-time.json',
  'tests/draft7/optional/format/date.json',
  'tests/draft7/optional/format/email.json',
  'tests/draft7/optional/format/hostname.json',
  'tests/draft7/optional/format/idn-email.json',
  'tests/draft7/optional/format/idn-hostname.json',
  'tests/draft7/optional/format/ipv4.json',
  'tests/draft7/optional/format/ipv6.json',
  'tests/draft7/optional/format/iri-reference.json',
  'tests/draft7/optional/format/iri.json',
  'tests/draft7/optional/format/json-pointer.json',
  'tests/draft7/optional/format/regex.json',
  'tests/draft7/optional/format/relative-json-pointer.json',
  'tests/draft7/optional/format/time.json',
  'tests/draft7/optional/format/uri-reference.json',
  'tests/draft7/optional/format/uri-template.json',
  'tests/draft7/optional/format/uri.json',
  'tests/draft7/optional/non-bmp-regex.json',
  'tests/draft7/optional/unicode.json',
  ✓ 'tests/draft7/pattern.json',
  ✓ 'tests/draft7/patternProperties.json' - adjusted boolean schema: false
  ✓ 'tests/draft7/properties.json',
  ✓ 'tests/draft7/propertyNames.json',
  ✖ ✖ 'tests/draft7/ref.json',
  ✖ 'tests/draft7/refRemote.json',
  ✓ 'tests/draft7/required.json',
  ✓ 'tests/draft7/type.json',
  ✓ 'tests/draft7/uniqueItems.json',
  ✖ 'tests/draft7/unknownKeyword.json'
 */


 // load TestCases
 draft07TestCases = flattenArray(draft07TestCases.map(require));


function runTestCase(Core, testCase, skipTest = []) {
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
}

export default function runAllTestCases(Core, skipTest = []) {
    draft07TestCases.forEach(testCase => runTestCase(Core, testCase, skipTest));
}

runAllTestCases(Draft07);
