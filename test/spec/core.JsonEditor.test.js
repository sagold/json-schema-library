const JsonEditor = require("../../lib/cores/JsonEditor");
require("./testDraft04")(JsonEditor, [
    // ignore theese tests
    "changed scope ref invalid", // not going to be supported (combination of id, folder (folder!!!), refs)
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
