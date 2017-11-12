const JsonEditor = require("../../lib/cores/JsonEditor");
require("./testDraft04")(JsonEditor, [
    // ignore theese tests
    "ref overrides any sibling keywords", // this is JsonEditor specific
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
