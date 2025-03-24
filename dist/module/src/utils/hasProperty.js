const hasOwnProperty = Object.prototype.hasOwnProperty;
export const hasProperty = (value, property) => !(value[property] === undefined || !hasOwnProperty.call(value, property));
