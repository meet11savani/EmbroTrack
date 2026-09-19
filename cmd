npm run dev


Remove-Item -Recurse -Force release 
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"
npm run electron:build