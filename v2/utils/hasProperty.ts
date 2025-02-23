const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasProperty = (value: Record<string, unknown>, property: string) =>
    !(value[property] === undefined || !hasOwnProperty.call(value, property));
