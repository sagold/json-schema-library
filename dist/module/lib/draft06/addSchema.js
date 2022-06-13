import remotes from "../../remotes";
import compileSchema from "./compile";
/**
 * register a json-schema to be referenced from another json-schema
 * @param url    base-url of json-schema (aka id)
 * @param schema
 */
export default function addSchema(url, schema) {
    schema.id = schema.id || url;
    remotes[url] = compileSchema(schema);
}
