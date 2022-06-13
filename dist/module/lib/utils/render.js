/**
 * Renders data into a string by {{variables}}.
 * Given a template string, removes all {{property}} substrings and replaces them with the property in the given data
 *
 * @param template - template string containing variables in handelbars/mustache style
 * @param data - flat object containing properties matching variables
 * @return rendered string
 */
export default function render(template, data = {}) {
    return template.replace(/\{\{\w+\}\}/g, match => data[match.replace(/[{}]/g, "")]);
}
