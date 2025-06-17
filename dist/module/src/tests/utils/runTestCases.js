import { strict as assert } from "assert";
import { getDraftTests } from "./getDraftTests.js";
import { addRemotes } from "./addRemotes.js";
import { compileSchema } from "../../compileSchema.js";
import { isObject } from "../../utils/isObject.js";
let measurements = {
    start: 0,
    validationDuration: 0,
    testCount: 0,
    end: 0,
    max: {
        duration: 0,
        title: "",
        schema: {}
    }
};
function runTestCase(setup, tc, remotes) {
    describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
        tc.testCases.forEach((testCase) => {
            var _a;
            const $schema = (_a = setup.metaSchema.$id) !== null && _a !== void 0 ? _a : setup.metaSchema.id;
            // get schema and add $schema to identify draft version
            const schema = isObject(testCase.schema) ? { $schema, ...testCase.schema } : testCase.schema;
            const node = compileSchema(schema, { remote: remotes, formatAssertion: tc.optional });
            // register tests
            describe(testCase.description, () => {
                if (setup.only && setup.only.description && setup.only.description !== testCase.description) {
                    return;
                }
                testCase.tests.forEach((testData) => {
                    if (setup.skipTests && setup.skipTests.includes(testCase.description)) {
                        it.skip(testData.description, () => { });
                        return;
                    }
                    it(testData.description, () => {
                        if (setup.logSchema === true || (setup.logSchema == null && setup.only)) {
                            console.log(testData.description, JSON.stringify(schema, null, 2), JSON.stringify(testData.data, null, 2));
                        }
                        const startTime = Date.now();
                        const { valid } = node.validate(testData.data);
                        const duration = Date.now() - startTime;
                        measurements.validationDuration += duration;
                        assert.equal(valid, testData.valid);
                        measurements.testCount++;
                        if (measurements.max.duration < duration) {
                            measurements.max.duration = duration;
                            measurements.max.title = testData.description;
                            measurements.max.schema = schema;
                        }
                    });
                });
            });
        });
    });
}
export default function runAllTestCases(setup) {
    var _a, _b, _c;
    const remotes = compileSchema({});
    const $schema = (_a = setup.metaSchema.$id) !== null && _a !== void 0 ? _a : setup.metaSchema.id;
    addRemotes(remotes, [setup.metaSchema, ...((_b = setup.metaSchemaList) !== null && _b !== void 0 ? _b : [])], $schema);
    measurements = {
        start: Date.now(),
        validationDuration: 0,
        testCount: 0,
        end: 0,
        max: {
            duration: 0,
            title: "",
            schema: {}
        }
    };
    // retrieve draft name from metaschema id
    const draftName = ((_c = setup.metaSchema.$id) !== null && _c !== void 0 ? _c : setup.metaSchema.id)
        .match(/draft[-/][^/]*/)
        .pop()
        .replace(/\//, "-");
    // parse draft name to draft version
    const draftId = draftName.match(/draft-0?([0-9]*-?[0-9]*)/).pop();
    describe(draftName, () => {
        getDraftTests(draftId)
            .filter((tc) => {
            var _a, _b;
            if ((_a = setup.only) === null || _a === void 0 ? void 0 : _a.name) {
                return ((_b = setup.only) === null || _b === void 0 ? void 0 : _b.name) === tc.name;
            }
            const runTestCase = setup.skipTestCase(tc);
            if (!runTestCase) {
                describe(`${tc.name}${tc.optional ? " (optional)" : ""}`, () => {
                    tc.testCases.forEach((test) => it.skip(test.description, () => { }));
                });
            }
            return runTestCase;
        })
            .forEach((tc) => runTestCase(setup, tc, remotes));
        after(() => {
            measurements.end = Date.now();
            process.env.DISABLE_LOG !== "true" &&
                console.log("\n", "time overall:", measurements.end - measurements.start, "ms", "time validations:", measurements.validationDuration, "ms", "average validation time:", measurements.validationDuration / measurements.testCount);
            // console.log("max time:", measurements.max);
        });
    });
}
