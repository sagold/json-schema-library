import draft07Meta from "../../../remotes/draft07.json";
import runAllTestCases from "../utils/runTestCases";
runAllTestCases({
    // only: {
    //     name: "vocabulary",
    //     description: "schema that uses custom metaschema with with no validation vocabulary"
    // },
    logSchema: false,
    skipTestCase: (t) => !["content", "float-overflow", "format-iri", "format-iri-reference", "format-idn-hostname"].includes(t.name),
    metaSchema: draft07Meta
});
