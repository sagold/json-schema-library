import remotes from "../remotes";
import compileSchema from "./compileSchema";
import { JSONSchema } from "./types";


/**
 * register a json-schema to be referenced from another json-schema
 * @param url    base-url of json-schema (aka id)
 * @param schema
 */
export default function addSchema(url: string, schema: JSONSchema): void {
    schema.id = schema.id || url;
    remotes[url] = compileSchema(schema);
}
