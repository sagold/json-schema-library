import { Keyword } from "../../Keyword";
import { containsKeyword as baseContainsKeyword, validateContains } from "../../keywords/contains";

export const containsKeyword: Keyword = {
    ...baseContainsKeyword,
    validate: (params) => validateContains(params, 1, Infinity)
};
