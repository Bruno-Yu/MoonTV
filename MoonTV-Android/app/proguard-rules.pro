# Add project specific ProGuard rules here.
-keepattributes *Annotation*
-keepattributes JavascriptInterface
-keep class com.moontv.android.WebAppInterface { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
