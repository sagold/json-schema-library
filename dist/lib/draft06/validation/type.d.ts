/**
 * @todo: type is also a keyword, as is properties, items, etc
 *
 * An instance has one of six primitive types (http://json-schema.org/latest/json-schema-core.html#rfc.section.4.2)
 * or seven in case of ajv https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#type
 * 1 null, 2 boolean, 3 object, 4 array, 5 number, 6 string (7 integer)
 */
declare const _default: {
    array: (core: any, schema: any, value: any, pointer: any) => any;
    object: (core: any, schema: any, value: any, pointer: any) => any;
    string: (core: any, schema: any, value: any, pointer: any) => any;
    integer: (core: any, schema: any, value: any, pointer: any) => any;
    number: (core: any, schema: any, value: any, pointer: any) => any;
    boolean: (core: any, schema: any, value: any, pointer: any) => any;
    null: (core: any, schema: any, value: any, pointer: any) => any;
};
export default _default;