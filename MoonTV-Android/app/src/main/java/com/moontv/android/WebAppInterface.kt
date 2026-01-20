package com.moontv.android

import android.app.Activity
import android.view.KeyEvent
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * WebView 與 JavaScript 的橋接介面
 */
class WebAppInterface(private val activity: Activity) {
    
    private val gson = Gson()
    
    /**
     * 分發按鍵事件到 WebView
     */
    @android.webkit.JavascriptInterface
    fun dispatchKeyEvent(keyCode: Int, action: Int): Boolean {
        val event = KeyEvent(action, keyCode)
        return activity.dispatchKeyEvent(event)
    }
    
    /**
     * 請求 Focus
     */
    @android.webkit.JavascriptInterface
    fun requestFocus() {
        activity.window.decorView.requestFocus()
    }
    
    /**
     * 獲取設備資訊
     */
    @android.webkit.JavascriptInterface
    fun getDeviceInfo(): String {
        val deviceInfo = mapOf(
            "model" to android.os.Build.MODEL,
            "osVersion" to android.os.Build.VERSION.RELEASE,
            "screenWidth" to activity.resources.displayMetrics.widthPixels,
            "screenHeight" to activity.resources.displayMetrics.heightPixels,
            "density" to activity.resources.displayMetrics.density
        )
        
        return gson.toJson(deviceInfo)
    }
    
    /**
     * 檢查是否為 TV 模式
     */
    @android.webkit.JavascriptInterface
    fun isTVMode(): Boolean {
        val pm = activity.packageManager
        return pm.hasSystemFeature(android.content.pm.PackageManager.FEATURE_LEANBACK)
    }
}
