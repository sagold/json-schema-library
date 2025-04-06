import __ from "./errors/__";
import { dashCase } from "./errors/createCustomError";
import { extendDraft } from "./extendDraft";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyKeyword } from "./keywords/oneOf";
/**
 * @draft-editor https://json-schema.org/draft/2019-09/release-notes
 *
 * Uses Draft 2019-09 and changes resolveOneOf to be fuzzy
 */
export const draftEditor = extendDraft(draft2019, {
    $schemaRegEx: ".",
    keywords: [oneOfFuzzyKeyword],
    errors: {
        minLengthError: (data) => {
            if (data.minLength === 1) {
                return {
                    type: "error",
                    name: "MinLengthOneError",
                    code: dashCase("MinLengthOneError"),
                    message: __("MinLengthOneError", data),
                    data
                };
            }
            return {
                type: "error",
                name: "MinLengthError",
                code: dashCase("MinLengthError"),
                message: __("MinLengthError", data),
                data
            };
        }
    }
});
