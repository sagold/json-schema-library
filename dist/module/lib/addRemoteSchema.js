/**
 * register a json-schema to be referenced from another json-schema
 * @param url    base-url of json-schema (aka id)
 * @param schema
 */
export default function addRemoteSchema(draft, url, schema) {
    schema.id = schema.id || url;
    draft.remotes[url] = draft.compileSchema(schema);
}
