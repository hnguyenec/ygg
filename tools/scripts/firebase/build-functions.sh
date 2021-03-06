#! /bin/bash

project=$1
target=$2
rootDir=$(pwd)

if [ -z "$project" ] || [ -z "$target" ]
then
  echo "=================================================="
  echo "Usage: build-functions.sh [PROJECT] [TARGET]"
  echo "PROJECT = ourbox | playwhat"
  echo "TARGET = local | develop"
  echo "=================================================="
  echo ""
  exit 1
fi

# Setup environment to develop
firebase use default
node tools/scripts/setup-environments.js $project $target

# build
ng build functions --prod

exit 0
