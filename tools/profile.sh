#!/bin/bash

mkdir -p profiles
rm -f isolate-*

FILE=$1
if [ -z "$1" ]; then
    FILE="doValidations"
    #exit 1
fi

# start profiling
node --prof "$FILE".js

# create profile
PROFILE=profiles/$(git rev-parse --abbrev-ref HEAD)-"$FILE"-`date '+%Y-%m-%d %H:%M:%S'`.txt
for f in isolate-*
do
    node --prof-process $f > "$PROFILE"
done

# cleanup
rm isolate-*
