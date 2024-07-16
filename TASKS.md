# Draft 2019-09 Scope

-   [✓] `getSchema` inconsistent return of non-node for root-requests
-   [ ] introduction of scopes reduces jlib performance by ~20-22%. can we do sth about this?
    -   moving this logic to draft 2019 would solve this, but introduce two different apis unless we can hide it
    -   a consistent api might lead to performance impacts of legacy drafts
    -   an inconsistent api would not be manageable (duplicate utils like getTemplate etc)
    -   there is probably a lot that can be improved (also in compile time)
-   [ ] add all subSchemas to scope-history as only if and anyOf are tested
-   [ ] decision on supported draft 2019-09 format-options

# Tasks

-   [ ] template default options retrieved from draft
-   [ ] additionalProperties: true per default
-   [ ] compile needs another parameter for rootschema, in case refs are defined elsewhere

### possibly

-   [ ] remove hard coded schema interpretation
-   [ ] Improve -- _oneOf-Error messages_ (specific errors where possible, instead of one-of-error)
-   [ ] Add -- Resolve $ref local json-pointer without requiring compiled schema
-   [ ] Refactor -- move type validation as keyword to validation/keywords
-   [ ] Refactor -- Use addValidation to setup base validation mappings?
-   [ ] Features -- latest draft support
-   [ ] Refactor -- improve performance
-   [ ] Feature -- Helper to find a json- and json-schema-pointer
