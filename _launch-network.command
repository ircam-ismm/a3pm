#!/bin/bash

if [ "$(dirname "$0")" == '.' ]
then
  dir="$(pwd)"
else
  dir="$(dirname "$0")"
fi

cd $dir

echo ""
echo "##################################"
echo "### launching network          ###"
echo "##################################"
echo ""

cd dns

./DNS_run.command
