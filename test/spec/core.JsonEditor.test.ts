import JsonEditor from "../../lib/cores/JsonEditor";
import runTest from "./testDraft04";


runTest(JsonEditor, [
    // ignore theese tests
    "ref overrides any sibling keywords", // this is JsonEditor specific
    "both oneOf valid (complex)", // JsonEditor specific, fuzzy match of oneOf leading to wrong validation
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
