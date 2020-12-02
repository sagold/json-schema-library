const toString = Object.prototype.toString;


export default function getTypeOf(value: any) {
    // eslint-disable-next-line newline-per-chained-call
    return toString.call(value).match(/\s([^\]]+)\]/).pop().toLowerCase();
}
