import __ from "./errors/__";
import { dashCase } from "./errors/createCustomError";
import { addFeatures } from "./addFeatures";
import { Draft } from "./types";
import { draft2019 } from "./draft2019";
import { oneOfFuzzyFeature } from "./features/oneOf";

function pimpFeatures(draft: Draft) {
    draft.features.forEach((feature) => {
        const logKeyword = () => feature.keyword;
        if (feature.validate) {
            feature.validate.toJSON = logKeyword;
        }
        if (feature.reduce) {
            feature.reduce.toJSON = logKeyword;
        }
        if (feature.resolve) {
            feature.resolve.toJSON = logKeyword;
        }
    });
    return draft;
}

/**
 * @draft-editor https://json-schema.org/draft/2019-09/release-notes
 *
 * Uses Draft 2019-09 and changes resolveOneOf to be fuzzy
 */
export const draftEditor: Draft = {
    ...pimpFeatures(addFeatures(draft2019, oneOfFuzzyFeature)),
    errors: {
        ...draft2019.errors,
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
    },
    $schemaRegEx: "."
};
