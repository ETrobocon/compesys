#!/bin/bash
#
# Copyright (c) 2024 ETロボコン実行委員会, Released under the MIT license
# See LICENSE
#

mkdir ./tmp

cp -r ./dist ./tmp

cp .env ./tmp
cp compesys.sh ./tmp
cp package.json ./tmp

project_name=`node -p "require('./package.json').name"`
cd ./tmp
tar -zcf ../dist/${project_name}.tar.gz `find . -type f`

cd ..
rm -rf ./tmp

exit 0