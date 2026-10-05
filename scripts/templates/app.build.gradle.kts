import java.util.Properties
import java.io.FileInputStream
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

android {
    compileSdk = 37
    namespace = "com.polar.ops"

    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "true"
        applicationId = "com.polar.ops"
        minSdk = 24
        targetSdk = 37

        versionCode = tauriProperties
            .getProperty("tauri.android.versionCode", "1")
            .toInt()

        versionName = tauriProperties
            .getProperty("tauri.android.versionName", "1.0")
    }

    val keystoreProperties = Properties()
    val candidateKeyFiles = listOf(
        rootProject.file("keystore.properties"),
        rootProject.file("key.properties"),
        rootProject.file("../keystore.properties"),
        rootProject.file("../../keystore.properties")
    )
    val activeKeystoreFile = candidateKeyFiles.firstOrNull { it.exists() && it.isFile }
    if (activeKeystoreFile != null) {
        activeKeystoreFile.inputStream().use { keystoreProperties.load(it) }
    }

    fun getSigningConfigValue(key: String, envVars: List<String>): String? {
        val fileVal = keystoreProperties.getProperty(key)?.trim()
        if (!fileVal.isNullOrEmpty()) return fileVal

        if (project.hasProperty(key)) {
            val gradleVal = project.property(key)?.toString()?.trim()
            if (!gradleVal.isNullOrEmpty()) return gradleVal
        }

        for (envName in envVars) {
            val envVal = System.getenv(envName)?.trim()
            if (!envVal.isNullOrEmpty()) return envVal
        }
        return null
    }

    val storeFilePath = getSigningConfigValue("storeFile", listOf("ANDROID_KEYSTORE_PATH", "KEYSTORE_PATH", "RELEASE_KEYSTORE_PATH"))
    val storePasswordValue = getSigningConfigValue("storePassword", listOf("ANDROID_KEYSTORE_PASSWORD", "KEYSTORE_PASSWORD", "RELEASE_KEYSTORE_PASSWORD"))
    val keyAliasValue = getSigningConfigValue("keyAlias", listOf("ANDROID_KEY_ALIAS", "KEY_ALIAS", "RELEASE_KEY_ALIAS"))
    val keyPasswordValue = getSigningConfigValue("keyPassword", listOf("ANDROID_KEY_PASSWORD", "KEY_PASSWORD", "RELEASE_KEY_PASSWORD"))

    val isProductionSigningConfigured = !storeFilePath.isNullOrBlank() &&
            !storePasswordValue.isNullOrBlank() &&
            !keyAliasValue.isNullOrBlank() &&
            !keyPasswordValue.isNullOrBlank()

    signingConfigs {
        if (isProductionSigningConfigured) {
            create("release") {
                val keystoreFile = if (File(storeFilePath).isAbsolute) {
                    File(storeFilePath)
                } else {
                    val baseDir = activeKeystoreFile?.parentFile ?: rootProject.projectDir
                    File(baseDir, storeFilePath)
                }

                if (!keystoreFile.exists()) {
                    throw GradleException("Release keystore file does not exist: ${keystoreFile.absolutePath}")
                }

                storeFile = keystoreFile
                storePassword = storePasswordValue
                keyAlias = keyAliasValue
                keyPassword = keyPasswordValue
            }
        }
    }

    buildTypes {
        getByName("debug") {
            applicationIdSuffix = ".debug"
            manifestPlaceholders["usesCleartextTraffic"] = "true"

            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false

            packaging {
                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }

        getByName("release") {
            if (isProductionSigningConfigured) {
                signingConfig = signingConfigs.getByName("release")
            } else {
                val requireProduction = (System.getenv("REQUIRE_PRODUCTION_SIGNING") == "true") ||
                        (project.findProperty("requireProductionSigning") == "true")
                if (requireProduction) {
                    throw GradleException(
                        """
                        ================================================================================
                        [POLAR-OPS BUILD ERROR] Production release signing is required but not configured!
                        Please provide valid credentials using one of the following methods:
                          1. Environment variables:
                             export ANDROID_KEYSTORE_PATH="/path/to/release.keystore"
                             export ANDROID_KEYSTORE_PASSWORD="password"
                             export ANDROID_KEY_ALIAS="alias"
                             export ANDROID_KEY_PASSWORD="password"
                          2. Or create a git-ignored keystore.properties file:
                             storeFile=/path/to/release.keystore
                             storePassword=password
                             keyAlias=alias
                             keyPassword=password
                          3. Or pass Gradle properties:
                             -PstoreFile=... -PstorePassword=... -PkeyAlias=... -PkeyPassword=...
                        ================================================================================
                        """.trimIndent()
                    )
                } else {
                    // Safe developer-friendly fallback for local testing
                    signingConfig = signingConfigs.getByName("debug")
                }
            }

            optimization {
                enable = true
            }

            proguardFiles(
                *fileTree(".") {
                    include("**/*.pro")
                    exclude("build/**")
                }.files.toTypedArray()
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    buildFeatures {
        buildConfig = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_1_8
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-process:2.10.0")

    testImplementation("junit:junit:4.13.2")

    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = file("tauri.build.gradle.kts"))