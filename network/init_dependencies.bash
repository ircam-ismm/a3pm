#!/bin/bash

cd "$(dirname "$0")"

base_pwd="$(pwd)"

echo $base_pwd
exit

echo ""
echo "###########################"
echo "### init git submodules ###"
echo "###########################"
echo ""

git submodule update --init --recursive

echo ""
echo "###########################"
echo "### dnsmasq             ###"
echo "###########################"
echo ""

cd "${base_pwd}/dnsmasq"

make clean all -j
mkdir -p "${base_pwd}/bin"
mv src/dnsmasq "${base_pwd}/bin"

make clean

echo "-----------------------------------------------------------------------"
echo "${base_pwd}/bin/dnsmasq is ready "
echo "-----------------------------------------------------------------------"
echo ""

# clean_up
