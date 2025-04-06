import __ from "./errors/__";
import { dashCase } from "./errors/createCustomError";
import { addKeywords } from "./addKeywords";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyKeyword } from "./keywords/oneOf";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
function extendDraft(draft, extension) {
    var _a, _b;
    const { keywords } = addKeywords(draft, ...((_a = extension.keywords) !== null && _a !== void 0 ? _a : []));
    const errors = { ...draft.errors, ...((_b = extension.errors) !== null && _b !== void 0 ? _b : {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        keywords,
        errors
    });
}
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
