# install

brew install bowtie-json-schema/tap/bowtie
https://docs.bowtie.report/en/stable/implementers/

# build

docker build -t localhost/jlib .
docker run --rm localhost/jlib

# test without bowtie

echo '{"cmd":"start","version":1}' | docker run -i jlib
echo '{"cmd":"run","seq":1,"case":{"schema":{"type": "string"},"tests":["valid",999]}}' | docker run -i jlib
echo '{"cmd":"dialect","dialect":"http://json-schema.org/draft-07/schema#"}' | docker run -i jlib
echo '{"cmd":"stop"}' | docker run -i jlib

# test with bowtie

> docker build -t localhost/jlib .
> then:

bowtie smoke -i localhost/jlib
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/type.json | bowtie summary --show failures

bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft7 > draft7.json
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2019-09 > draft2019-09.json
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12 > draft2020-12.json

bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft7 | bowtie summary --show failures
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2019-09 | bowtie summary --show failures
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12 | bowtie summary --show failures

**Fails**
bowtie suite $(bowtie filter-implementations | sed 's/^/-i /') https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12 >draft2020-12.json

bowtie suite $(bowtie filter-implementations | sed 's/^jlib/-i /') https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/tests/draft2020-12 >draft2020-12.json

bowtie suite -i localhost/jlib draft7 | bowtie summary
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7/type.json | bowtie summary --show failures
bowtie suite -i localhost/jlib https://github.com/json-schema-org/JSON-Schema-Test-Suite/blob/main/tests/draft7 | bowtie summary --show failures
bowtie suite -i localhost/jlib draft7 | bowtie summary --show failures
bowtie validate -i localhost/jlib draft7 | bowtie summary --show failures

**Does not finish**
bowtie run --dialect 7 -i localhost/jlib
bowtie validate -i localhost/jlib <(printf '{"type": "integer"}') <(printf 37) <(printf '"foo"')
bowtie run -i localhost/jlib draft7 | bowtie summary --show failures
bowtie run -i localhost/jlib -V '{"description": "test case 1", "schema": {}, "tests": [{"description": "a test", "instance": {}}]}'
bowtie run -i localhost/jlib -V --fail-fast
