import draft04Meta from "./draft04.js";
import draft06Meta from "./draft06.js";
import draft07Meta from "./draft07.js";
import draft2019Meta from "./draft2019-09.js";
import draft2019MetaApplicator from "./draft2019-09_meta_applicator.js";
import draft2019MetaContent from "./draft2019-09_meta_content.js";
import draft2019MetaCore from "./draft2019-09_meta_core.js";
import draft2019MetaFormat from "./draft2019-09_meta_format.js";
import draft2019MetaMetaData from "./draft2019-09_meta_meta-data.js";
import draft2019MetaValidation from "./draft2019-09_meta_validation.js";
import draft2020Meta from "./draft2020-12.js";
import draft2020MetaApplicator from "./draft2020-12_meta_applicator.js";
import draft2020MetaContent from "./draft2020-12_meta_content.js";
import draft2020MetaCore from "./draft2020-12_meta_core.js";
import draft2020MetaFormatAnnotation from "./draft2020-12_meta_format_annotation.js";
import draft2020MetaFormatAssertion from "./draft2020-12_meta_format_assertion.js";
import draft2020MetaMetaData from "./draft2020-12_meta_meta_data.js";
import draft2020MetaUnevaluated from "./draft2020-12_meta_unevaluated.js";
import draft2020MetaValidation from "./draft2020-12_meta_validation.js";
/** remote meta-schema stored by schema $id */
const remotes = {};
[
    draft04Meta,
    draft06Meta,
    draft07Meta,
    draft2019Meta,
    draft2019MetaApplicator,
    draft2019MetaContent,
    draft2019MetaCore,
    draft2019MetaFormat,
    draft2019MetaMetaData,
    draft2019MetaValidation,
    draft2020Meta,
    draft2020MetaApplicator,
    draft2020MetaContent,
    draft2020MetaCore,
    draft2020MetaFormatAnnotation,
    draft2020MetaFormatAssertion,
    draft2020MetaMetaData,
    draft2020MetaUnevaluated,
    draft2020MetaValidation
].forEach((schema, index) => { var _a, _b; return (remotes[(_b = (_a = schema.$id) !== null && _a !== void 0 ? _a : schema.id) !== null && _b !== void 0 ? _b : index] = schema); });
export { remotes };
