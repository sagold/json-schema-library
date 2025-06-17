import draft06Meta from "../../../remotes/draft06.js";
import runAllTestCases from "../utils/runTestCases.js";
runAllTestCases({
    // only: {
    //     name: "vocabulary",
    //     description: "schema that uses custom metaschema with with no validation vocabulary"
    // },
    logSchema: false,
    skipTestCase: (t) => !["float-overflow"].includes(t.name),
    metaSchema: draft06Meta
});
