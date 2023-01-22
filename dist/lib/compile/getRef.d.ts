import { JsonSchema } from "../types";
import { Context } from "./types";
export default function getRef(context: Context, rootSchema: JsonSchema, $ref: string): JsonSchema;
