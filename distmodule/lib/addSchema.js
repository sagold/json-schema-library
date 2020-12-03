import remotes from "../remotes";
import compileSchema from "./compileSchema";
export default function addSchema(url, schema) {
    schema.id = schema.id || url;
    remotes[url] = compileSchema(schema);
}
