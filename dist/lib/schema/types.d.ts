export type Type = {
    type: boolean;
    definitions?: string[];
    validationKeywords?: string[];
    keywords?: string[];
};
declare const Types: Record<string, Type>;
export default Types;
