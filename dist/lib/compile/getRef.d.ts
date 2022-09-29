import { JSONSchema } from "../types";
import { Context } from "./types";
export default function getRef(context: Context, rootSchema: JSONSchema, $ref: string): JSONSchema;
