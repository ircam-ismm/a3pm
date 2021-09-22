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
echo "### install command line tools ###"
echo "##################################"
echo ""

xcode-select --install

echo ""
echo "##################################"
echo "### install network utilities  ###"
echo "##################################"
echo ""

git submodule add https://github.com/imp/dnsmasq.git network/dnsmasq
./network/init_dependencies.bash

cd $dir

echo ""
echo "##################################"
echo "### install and build app      ###"
echo "##################################"
echo ""

npm install
npm run build
