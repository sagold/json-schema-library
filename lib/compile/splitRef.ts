const suffixes = /(#)+$/g;
const emptyValues = ["", null, "#"];


export default function splitRef($ref: string) {
    if (emptyValues.includes($ref)) {
        return [];
    }

    $ref = $ref.replace(suffixes, "");
    if ($ref.indexOf("#") === -1) {
        return [$ref.replace(/(#|\/)+$/g, "")];
    }

    if ($ref.indexOf("#") === 0) {
        return [$ref.replace(suffixes, "")];
    }

    const result = $ref.split("#");
    result[0] = result[0].replace(/(#|\/)+$/g, "");
    result[1] = `#${result[1].replace(suffixes, "")}`;
    return result;
}
