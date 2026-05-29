export const mainActivityCode = `package com.rpsc.quizapp

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.rpsc.quizapp.model.Question
import com.rpsc.quizapp.repository.QuizRepository
import java.util.UUID

class MainActivity : ComponentActivity() {
    private val db = FirebaseFirestore.getInstance()
    private val repository = QuizRepository(db)
    private val sessionId = "SES-AND-" + UUID.randomUUID().toString().takeLast(6).uppercase()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFFF8FAFC)
                ) {
                    QuizDashboard(
                        sessionId = sessionId, 
                        repository = repository,
                        onShowToast = { msg -> Toast.makeText(applicationContext, msg, Toast.LENGTH_SHORT).show() }
                    )
                }
            }
        }
    }
}`;

export const quizRepositoryCode = `package com.rpsc.quizapp.repository

import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.rpsc.quizapp.model.Question
import com.rpsc.quizapp.model.Options

class QuizRepository(private val db: FirebaseFirestore) {

    fun loadLastQuizProgress(
        sessionId: String,
        onComplete: (List<Question>, Int, Map<Int, String>, Boolean) -> Unit
    ) {
        db.collection("sessions").document(sessionId).get()
            .addOnSuccessListener { doc ->
                if (doc.exists()) {
                    try {
                        val currentIndex = doc.getLong("current_index")?.toInt() ?: 0
                        val answersRaw = doc.get("user_answers") as? Map<String, String> ?: emptyMap()
                        val answers = answersRaw.mapKeys { it.key.toInt() }
                        val questionsListRaw = doc.get("questions") as? List<Map<String, Any>> ?: emptyList()
                        val questions = questionsListRaw.map { qMap ->
                            val optionsMap = qMap["options"] as? Map<String, String> ?: emptyMap()
                            Question(
                                id = qMap["id"] as? String ?: "",
                                question = qMap["question"] as? String ?: "",
                                options = Options(
                                    A = optionsMap["A"] ?: "",
                                    B = optionsMap["B"] ?: "",
                                    C = optionsMap["C"] ?: "",
                                    D = optionsMap["D"] ?: ""
                                ),
                                correctAnswer = qMap["correctAnswer"] as? String ?: "A",
                                explanation = qMap["explanation"] as? String ?: "",
                                is_custom = qMap["is_custom"] as? Boolean ?: false
                            )
                        }
                        if (questions.isNotEmpty()) {
                            onComplete(questions, currentIndex, answers, true)
                            return@addOnSuccessListener
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                onComplete(emptyList(), 0, emptyMap(), false)
            }
            .addOnFailureListener {
                onComplete(emptyList(), 0, emptyMap(), false)
            }
    }

    fun writeActiveSessionToFirestore(
        sessionId: String,
        operation: String,
        currentIndex: Int,
        currentQuestion: Question
    ) {
        val payload = hashMapOf(
            "session_id" to sessionId,
            "operation" to operation,
            "current_index" to currentIndex,
            "sync_status" to "VERIFIED_SYNC",
            "last_updated" to System.currentTimeMillis(),
            "active_question_id" to currentQuestion.id,
            "is_custom" to currentQuestion.is_custom
        )

        db.collection("sessions").document(sessionId)
            .set(payload, SetOptions.merge())
    }
}`;

export const buildGradleCode = `// Top-level build file
buildscript {
    ext.kotlin_version = "1.9.0"
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.1.1"
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        classpath "com.google.gms:google-services:4.3.15"
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.lifecycle:lifecycle-runtime-ktx:2.6.2'
    implementation 'androidx.activity:activity-compose:1.8.0'
    implementation platform('androidx.compose:compose-bom:2023.08.00')
    implementation 'androidx.compose.ui:ui'
    implementation 'androidx.compose.material3:material3'
    implementation platform('com.google.firebase:firebase-bom:32.3.1')
    implementation 'com.google.firebase:firebase-firestore-ktx'
}`;

export const manifestCode = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.rpsc.quizapp">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:label="RPSC MCQ AI Quiz App"
        android:theme="@style/Theme.Material3.Light.NoActionBar">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

export const devPlanCode = `===========================================================
🔥 RPSC MCQ NATIVE KOTLIN ANDROID CODENAME PLATFORM DEV DEV
===========================================================

1. App Config Metadata Space:
   - Package Name: com.rpsc.quizapp
   - Build Compiles: Android targetSdk 34 (API Level 34)
   - Database Connection: Cloud Firestore (Synced live payloads)

2. Firebase Real-Time Connection App ID:
   - Client App UUID matches console token: 
     "mobilesdk_app_id": "1:853043169458:android:16f6f4f352037d7493a1ab"

3. State Resumption Protocol:
   Checks /sessions/{session_id} upon onCreate(). If exists, 
   instantly resumes current question index & active answers, 
   avoiding unneeded LLM tokens or credit drain!

4. In-App Pop-Up Custom Question Injection:
   Uses Jetpack Compose 'AlertDialog' and captures topics, 
   converting any custom prompt into active lists with 
   an 'is_custom = true' Firestore JSON update.

5. Mandatory UI Visibility Directive:
   - HUD Sync Monitor Terminal is hardcoded to hidden ('GONE') on initialization.
   - Click/Tap Bypass: 5 rapid clicks on the 'AI ENGINE | RPSC OPTIMIZED' top-bar 
     text triggers the hidden debug mode to toggle the console HUD visibility, 
     enabling live stream validation on-the-go.
`;
