package com.reminderapp

import com.reactnativenavigation.NavigationActivity

class MainActivity : NavigationActivity() {
    override fun addDefaultSplashLayout() {
        setContentView(R.layout.splash_screen)
    }
}
