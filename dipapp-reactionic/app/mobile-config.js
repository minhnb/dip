// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
    id: 'io.cvp.dip',
    name: 'Dip',
    description: 'Dip mobile app',
    author: 'minh.nguyen',
    email: 'minh.nguyen@cofoundervp.com',
    website: 'http://cofoundervp.com/',
    version: '0.0.1',
    buildNumber: 1
});

// Set up resources such as icons and launch screens.
App.icons({
    'ios_settings': 'resources/icons/app-icon.png',
    'ios_settings_2x': 'resources/icons/app-icon-2x.png',
    'ios_settings_3x': 'resources/icons/app-icon-3x.png',
    'iphone': 'resources/icons/app-icon.png',
    'iphone_2x': 'resources/icons/app-icon-2x.png',
    'iphone_3x': 'resources/icons/app-icon-3x.png',
    'ios_spotlight': 'resources/icons/app-icon.png',
    'ios_spotlight_2x': 'resources/icons/app-icon-2x.png',
    'ios_spotlight_3x': 'resources/icons/app-icon-3x.png',
    'ipad': 'resources/icons/app-icon.png',
    'ipad_2x': 'resources/icons/app-icon-2x.png',
    'ipad_3x': 'resources/icons/app-icon-3x.png',
    'ipad_pro': 'resources/icons/app-icon-3x.png',

    'android_ldpi': 'resources/icons/app-icon.png',
    'android_mdpi': 'resources/icons/app-icon.png',
    'android_hdpi': 'resources/icons/app-icon-2x.png',
    'android_xhdpi': 'resources/icons/app-icon-2x.png',
    'android_xxhdpi': 'resources/icons/app-icon-3x.png',
    'android_xxxhdpi': 'resources/icons/app-icon-3x.png'
});

App.launchScreens({
    'iphone': 'resources/splash/portrait.png',
    'iphone_2x': 'resources/splash/portrait.png',
    'iphone_3x': 'resources/splash/portrait.png',
    'iphone5': 'resources/splash/portrait.png',
    'iphone6': 'resources/splash/portrait.png',
    'iphone6p_portrait': 'resources/splash/portrait.png',
    'iphone6p_landscape': 'resources/splash/landscape.png',
    'ipad_portrait': 'resources/splash/portrait.png',
    'ipad_landscape': 'resources/splash/landscape.png',
    'ipad_portrait_2x': 'resources/splash/portrait.png',
    'ipad_landscape_2x': 'resources/splash/landscape.png',

    'android_ldpi_portrait': 'resources/splash/portrait.png',
    'android_ldpi_landscape': 'resources/splash/landscape.png',
    'android_mdpi_portrait': 'resources/splash/portrait.png',
    'android_mdpi_landscape': 'resources/splash/landscape.png',
    'android_hdpi_portrait': 'resources/splash/portrait.png',
    'android_hdpi_landscape': 'resources/splash/landscape.png',
    'android_xhdpi_portrait': 'resources/splash/portrait.png',
    'android_xhdpi_landscape': 'resources/splash/landscape.png',
    'android_xxhdpi_portrait': 'resources/splash/portrait.png',
    'android_xxhdpi_landscape': 'resources/splash/landscape.png',
    'android_xxxhdpi_portrait': 'resources/splash/portrait.png',
    'android_xxxhdpi_landscape': 'resources/splash/landscape.png',
});

// Let these urls access the following domains
App.accessRule("*"); // @@@@@@@@@@@@@@@@

// Set PhoneGap/Cordova preferences
App.setPreference('BackgroundColor', '0x00BDD6');
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('BackupWebStorage', 'local');
App.setPreference('AutoHideSplashScreen' , true); // ???
App.setPreference('KeyboardDisplayRequiresUserAction', false);

// https://github.com/Differential/meteor-mobile-cookbook/blob/master/iOS/Status%20Bar.md
App.setPreference('StatusBarOverlaysWebView', true);
App.setPreference('StatusBarStyle', 'lightcontent');

// Pass preferences for a particular PhoneGap/Cordova plugin
// SEE http://cordova.apache.org/docs/en/4.0.0/config_ref_index.md.html#The%20config.xml%20File

// If we will use this: https://github.com/mbanting/meteor-cordova-accounts-resume, the we'll need:
//App.configurePlugin('org.apache.cordova.file', {
//    iosPersistentFileLocation: 'Library'
//});


App.configurePlugin('com.phonegap.plugins.facebookconnect', {
    APP_ID: '1656233541263739',
    API_KEY: '8ea337dbd84699a10d75daa30093e5dc',
    APP_NAME: 'Dip'
});
