import strings from "../config/strings";
import render from "./render";
/**
 * Renders the given string as defined in __@see config/strings.js__
 * @param keyword
 * @param data - template data
 * @param fallback - fallback template
 * @return resulting string
 */
export default function __(keyword, data, fallback = keyword) {
    var _a;
    const template = (_a = strings[keyword]) !== null && _a !== void 0 ? _a : fallback;
    return render(template, data);
}
