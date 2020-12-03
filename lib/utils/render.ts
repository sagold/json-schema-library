/**
 * Renders data into a string by {{variables}}.
 * Given a template string, removes all {{property}} substrings and replaces them with the property in the given data
 *
 * @param {String} template     - template string containing variables in handelbars/mustache style
 * @param {Object} data         - flat object containing properties matching variables
 * @return {String} rendered string
 */
export default function render(template: string, data = {}) {
    return template.replace(/\{\{\w+\}\}/g, match => data[match.replace(/[{}]/g, "")]);
}
