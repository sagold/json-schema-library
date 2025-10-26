import settings from "./settings";
import { strict as assert } from "assert";

describe("settings", () => {
    let _regex: string;
    beforeEach(() => {
        _regex = settings.REGEX_FLAGS;
        assert(settings.REGEX_FLAGS !== "v");
        settings.REGEX_FLAGS = "v";
    });

    it("should store modifications", async () => {
        const { default: settings } = require("./settings");

        assert.equal(settings.REGEX_FLAGS, "v");
    });

    afterEach(() => {
        settings.REGEX_FLAGS = _regex;
    });
});
