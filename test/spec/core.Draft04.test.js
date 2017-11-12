const Draft04 = require("../../lib/cores/Draft04");
require("./testDraft04")(Draft04, [
    // ignore theese tests
    "a float is not an integer even without fractional part" // will always fail within javascript
]);
