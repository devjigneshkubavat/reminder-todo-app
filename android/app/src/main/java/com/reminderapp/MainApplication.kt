package com.reminderapp

import com.facebook.react.PackageList
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.reactnativenavigation.NavigationApplication
import com.reactnativenavigation.react.NavigationReactNativeHost
import com.otahotupdate.OtaHotUpdate

class MainApplication : NavigationApplication() {
  override val reactNativeHost: ReactNativeHost by lazy {
    object : NavigationReactNativeHost(this@MainApplication) {
      override fun getUseDeveloperSupport() = BuildConfig.DEBUG
      override fun getJSMainModuleName() = "index"
      override fun getJSBundleFile(): String? =
        if (BuildConfig.DEBUG) null else OtaHotUpdate.bundleJS(this@MainApplication)
      override val isNewArchEnabled = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled = BuildConfig.IS_HERMES_ENABLED
      override fun getPackages(): List<ReactPackage> = PackageList(this).packages
    }
  }

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(this, reactNativeHost)
  }
}
