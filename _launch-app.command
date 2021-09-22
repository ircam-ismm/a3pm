#!/bin/bash

if [ "$(dirname "$0")" == '.' ]
then
  dir="$(pwd)"
else
  dir="$(dirname "$0")"
fi

cd $dir

ENV=prod node "./.build/server/index.js"
