import __ from "./errors/__";
import { dashCase } from "./errors/createCustomError";
import { addFeatures } from "./addFeatures";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyFeature } from "./features/oneOf";
import { sanitizeFeatures } from "./utils/sanitizeFeatures";
import { Draft } from "./types";

type PartialDraft = Partial<Omit<Draft, "errors">> & { errors?: Partial<Draft["errors"]> };

function extendDraft(draft: Draft, extension: PartialDraft) {
    const { features } = addFeatures(draft, ...(extension.features ?? []));
    const errors = { ...draft.errors, ...(extension.errors ?? {}) };
    return sanitizeFeatures({
        ...draft,
        ...extension,
        features,
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
    features: [oneOfFuzzyFeature],
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
