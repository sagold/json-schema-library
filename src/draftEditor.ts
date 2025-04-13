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
        "min-length-error": (data) => {
            if (data.minLength === 1) {
                return {
                    type: "error",
                    code: "min-length-one-error",
                    message: "An input is required",
                    data
                };
            }
            return {
                type: "error",
                code: "min-length-error",
                message: render(
                    "Value in `{{pointer}}` is `{{length}}`, but should be `{{minLength}}` at minimum",
                    data
                ),
                data
            };
        }
    }
});
