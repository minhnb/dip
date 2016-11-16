App id: io.cvp.dip

HOW TO RUN
    cd app
- Browser
    meteor run --port portValue
- Android
    meteor run android --port portValue
    meteor run android-device --port portValue
- Set up $ANDROID_HOME and $PATH before run
See https://www.meteor.com/tutorials/blaze/running-on-mobile for more details
HOW TO BUILD
- Create folder output
- Build
    meteor build ../output --server=dip.cvp.io
- Sign app
    jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 release-unsigned.apk Dip -keystore ../../dipandroid.keystore
    $ANDROID_HOME/build-tools/25.0.0/zipalign 4 release-unsigned.apk Dip.apk
- Get hash key to add to Facebook Android app
    keytool -exportcert -alias Dip -keystore ../../dipandroid.keystore | openssl sha1 -binary | openssl base64