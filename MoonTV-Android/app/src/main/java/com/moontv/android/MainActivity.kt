package com.moontv.android

import android.annotation.SuppressLint
import android.content.pm.ActivityInfo
import android.os.Bundle
import android.view.KeyEvent
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import com.moontv.android.BuildConfig

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var webAppInterface: WebAppInterface

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 鎖定橫向螢幕
        requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        
        // 初始化 WebView
        webView = WebView(this)
        
        // 初始化 Web Interface
        webAppInterface = WebAppInterface(this)
        
        setupWebView()
        
        setContentView(webView)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        // WebView 設定
        webView.apply {
            settings.apply {
                // 啟用 JavaScript
                javaScriptEnabled = true
                
                // 啟用 DOM Storage
                domStorageEnabled = true
                
                // 啟用 Database
                databaseEnabled = true
                
                // 設定 User Agent
                userAgentString = "MoonTV-AndroidTV/1.0 (Android TV)"
                
                // 支援縮放
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                
                // 啟用混合內容
                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
            }
            
            // 添加 JavaScript Interface
            addJavascriptInterface(webAppInterface, "AndroidTV")
            
            // WebViewClient
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    // 頁面載入完成後初始化 TV Bridge
                    view?.evaluateJavascript(
                        "if (typeof initTVBridge === 'function') initTVBridge();",
                        null
                    )
                }
            }
            
            // WebChromeClient
            webChromeClient = WebChromeClient()
            
            // 載入 MoonTV（使用配置中的 URL）
            loadUrl("${BuildConfig.MOONTV_URL}?tv=1")
        }
    }

    // 攔截遙控器按鍵事件
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // 傳遞給 WebView 處理
        return webView.dispatchKeyEvent(event) || super.dispatchKeyEvent(event)
    }

    // 返回鍵處理
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        super.onDestroy()
        webView.destroy()
    }
}
