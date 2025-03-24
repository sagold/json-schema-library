import { JsonError } from "../types";
export default function sanitizeErrors<T = JsonError>(list: (JsonError | unknown)[], result?: T[]): T[];
