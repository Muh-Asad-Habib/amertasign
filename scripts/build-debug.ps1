# Build ulang APK debug dari nol dengan log ke file.
Set-Location "D:\Coding\AmertaSign\AmertaSign-mobile\android"
.\gradlew --stop 2>&1 | Out-Null
.\gradlew assembleDebug 2>&1 | Set-Content "D:\Coding\AmertaSign\AmertaSign-mobile\android\build-log.txt" -Encoding UTF8

