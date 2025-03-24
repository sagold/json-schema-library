export const isType = (schemaType: string | string[], type: string) =>
    schemaType === type || schemaType?.includes?.(type);
