# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Security for react-native-mmkv
-keep class com.mrousavy.mmkv.** { *; }
-keep class com.tencent.mmkv.** { *; }

# Security for Nitro Modules and react-native-video
-keep class com.margelo.nitro.** { *; }
-keep class com.twg.video.** { *; }

# Preservation of annotations necessary for the correct operation of the JNI bridge
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Protection for Zustand and the Hermes engine
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
}