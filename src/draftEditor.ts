import { dashCase } from "./utils/dashCase";
import { extendDraft } from "./Draft";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyKeyword } from "./keywords/oneOf";
import { render } from "./errors/render";

/**
 * @draft-editor https://json-schema.org/draft/2019-09/release-notes
 *
 * Uses Draft 2019-09 and changes resolveOneOf to be fuzzy
 */
export const draftEditor = extendDraft(draft2019, {
    $schemaRegEx: ".",
    keywords: [oneOfFuzzyKeyword],
    errors: {
        MinLengthError: (data) => {
            if (data.minLength === 1) {
                return {
                    type: "error",
                    name: "MinLengthOneError",
                    code: dashCase("MinLengthOneError"),
                    message: "Input is required",
                    data
                };
            }
            return {
                type: "error",
                name: "MinLengthError",
                code: dashCase("MinLengthError"),
                message: render("Value in `{{pointer}}` is `{{length}}`, but should be `{{minimum}}` at minimum", data),
                data
            };
        }
    }
});
