import __ from "./errors/__";
import { dashCase } from "./errors/createCustomError";
import { addKeywords } from "./addKeywords";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyKeyword } from "./keywords/oneOf";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
import { Draft } from "./types";

type PartialDraft = Partial<Omit<Draft, "errors">> & { errors?: Partial<Draft["errors"]> };

function extendDraft(draft: Draft, extension: PartialDraft) {
    const { keywords } = addKeywords(draft, ...(extension.keywords ?? []));
    const errors = { ...draft.errors, ...(extension.errors ?? {}) };
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
