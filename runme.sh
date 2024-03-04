yarn install
yarn upgrade
yarn outdated
ll node_modules/
yarn start
#yarn build
#node_modules/.bin/electron-builder -l rpm
yarn build --linux --dir


_electron_dist=/usr/lib64/electron
_electron_ver=$(cat ${_electron_dist}/version)
npm exec -c "electron-builder --linux --dir -c.electronDist=${_electron_dist} -c.electronVersion=${_electron_ver} "


electron dist/linux-unpacked/resources/app.asar &
