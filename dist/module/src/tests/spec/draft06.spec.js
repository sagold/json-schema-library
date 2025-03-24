import draft06Meta from "../../../remotes/draft06.json";
import runAllTestCases from "../utils/runTestCases";
runAllTestCases({
    // only: {
    //     name: "vocabulary",
    //     description: "schema that uses custom metaschema with with no validation vocabulary"
    // },
    logSchema: false,
    skipTestCase: (t) => !["ecmascript-regex", "non-bmp-regex", "float-overflow"].includes(t.name),
    metaSchema: draft06Meta
});
