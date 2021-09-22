#!/bin/bash

if [ "$(dirname "$0")" == '.' ]
then
  # launched from command line (not sure this is really robust...)
  dir="$(pwd)"
else
  # launched from dbl-click
  dir="$(dirname "$0")"
fi

cd $dir

echo ""
echo "##################################"
echo "### get sources                ###"
echo "##################################"
echo ""

git pull origin main

echo ""
echo "##################################"
echo "### install and build app      ###"
echo "##################################"
echo ""

rm -Rf node_modules
npm install
npm run build

