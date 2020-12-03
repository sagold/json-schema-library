import remotes from "../remotes";
import compileSchema from "./compileSchema";
import { JSONSchema } from "./types";


export default function addSchema(url: string, schema: JSONSchema) {
    schema.id = schema.id || url;
    remotes[url] = compileSchema(schema);
}
