# RPSC MCQ Native Android App (Kotlin)

**Package Space**: `com.rpsc.quizapp`  
**Core SDK Stack**: Jetpack Compose, Kotlin Co-routines, Firebase Cloud Firestore, SharedPreferences caching.

This is the native Android implementation of the **RPSC MCQ competitive exam engine** matching the exact behavior on our web console.

## 🌟 Implemented Requirements

### 1. Automated Resumption (Sudden Exit Handler)
- On startup, the `MainActivity` lifecycle executes a query looking up active progress in Firestore path `/sessions/{session_id}`.
- If there is an active session, progress is restored instantly down to the correct question index and prior selection options, avoiding any data loss or unnecessary LLM generation calls.
- Progress is also synced concurrently to `SharedPreferences` to support immediate local caching.

### 2. Pop-up Custom MCQ Injection
- Users can click the "Inject MCQ" command during inactive intervals.
- The pop-up `AlertDialog` captures topics, syllabus keys, or custom inputs.
- The database formatting logic generates a structured 4-option challenge, tags it with `is_custom = true`, and places it dynamically as the immediate next question in the active list.

### 3. Real-Time HUD Monitor Terminal
- A gorgeous floating overlay console is present directly on the UI screen showing:
  - Active session paths: `/sessions/{session_id}`
  - Synchronous database transaction feeds: `NEW_GENERATION`, `POPUP_INJECT`, `RESUME_SESSION`, `LOAD_CACHE`.
  - Actual Firestore payloads in real-time JSON block notation.
  - Active index counts and the status of custom question flags.

---

## 🛠️ Step-by-Step Installation

### Step 1: Copy Google Services Configuration
Ensure your `google-services.json` file is copied directly into `/android-app/app/` subdirectory. This hooks the app up to your Firebase console with the generated App ID:
`"mobilesdk_app_id": "1:853043169458:android:16f6f4f352037d7493a1ab"`.

### Step 2: Open with Android Studio
1. Launch **Android Studio (Hedgehog or newer)**.
2. Select **File -> Open** and point to `/android-app` directory.
3. Allow Gradle to initialize and download resources (approximately 2 minutes).

### Step 3: Run the Application
1. Connect your Android device or start a virtual **AVD Emulator** (API LEVEL 33+ recommended).
2. Click the **Run** button (green play icon) or press `Shift + F10`.
3. Test sudden app killings by pressing Home, swiping the app away, and relaunching to observe the **Automated Resumption** flow in action!
