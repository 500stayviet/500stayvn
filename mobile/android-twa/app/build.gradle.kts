plugins {
    id("com.android.application")
}

// 루트 gradle.properties 의 twaHostname 과 AndroidManifest 의도 필터·기본 URL 동기화
val twaHost =
    (project.findProperty("twaHostname") as String?)?.trim()?.takeIf { it.isNotEmpty() }
        ?: "example.com"

android {
    namespace = "vn.stayviet.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "vn.stayviet.app"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        manifestPlaceholders["twaHostname"] = twaHost
        // LauncherActivity DEFAULT_URL — strings.xml 과 중복되지 않도록 resValue 로만 주입
        resValue("string", "twa_default_url", "https://$twaHost/")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
