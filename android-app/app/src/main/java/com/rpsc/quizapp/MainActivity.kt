package com.rpsc.quizapp

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

/**
 * RPSC MCQ Quiz App - Core AI Engine & Android Controller
 * 
 * Direct State Management Implementation:
 * 1. AUTOMATED RESUMPTION (Sudden Exit Handler via SharedPreferences + Firestore)
 * 2. POP-UP QUESTION INJECTION (In-App popup format to MCQ, maps to active array with 'is_custom: true')
 * 3. TOKEN & CREDIT SAVING CONSTRAINTS (Topic cache lookup before generating new LLM templates)
 */
class MainActivity : ComponentActivity() {
    private val db = FirebaseFirestore.getInstance()
    private val repository = QuizRepository(db)
    
    // Unique session ID for synchronization tracking
    private val sessionId = "SES-AND-" + UUID.randomUUID().toString().takeLast(6).uppercase()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFFF8FAFC) // Slate 50 background color
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
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuizDashboard(
    sessionId: String, 
    repository: QuizRepository,
    onShowToast: (String) -> Unit
) {
    // App and sync states
    var curIndex by remember { mutableStateOf(0) }
    var activeOperation by remember { mutableStateOf("NEW_GENERATION") }
    var questionsList by remember { mutableStateOf<List<Question>>(emptyList()) }
    var userAnswers by remember { mutableStateOf<Map<Int, String>>(emptyMap()) }
    
    var showInjectDialog by remember { mutableStateOf(false) }
    var customTextPrompt by remember { mutableStateOf("") }
    var isSavingState by remember { mutableStateOf(false) }
    var showConsoleHud by remember { mutableStateOf(false) }
    var isDeveloperModeActivated by remember { mutableStateOf(false) }

    // Tap dynamics for hidden developer bypass
    var devTapCount by remember { mutableStateOf(0) }
    var lastTapTime by remember { mutableStateOf(0L) }

    // On Launch: Run AUTOMATED RESUMPTION
    // Checks Firestore/SharedPreferences to restore state from the last saved index
    LaunchedEffect(Unit) {
        repository.loadLastQuizProgress(sessionId) { cachedQuestions, savedIndex, answers, success ->
            if (success && cachedQuestions.isNotEmpty()) {
                questionsList = cachedQuestions
                curIndex = savedIndex
                userAnswers = answers
                activeOperation = "RESUME_SESSION"
                onShowToast("Automated Resumption: Session Restored at Question $savedIndex!")
            } else {
                // Initialize default set if not resumed
                questionsList = repository.getFallbackDefaultSet()
                activeOperation = "NEW_GENERATION"
                repository.writeActiveSessionToFirestore(sessionId, "NEW_GENERATION", curIndex, questionsList[curIndex])
            }
        }
    }

    // Direct Sync on Index changes (Live Firestore sync)
    LaunchedEffect(curIndex, questionsList) {
        if (questionsList.isNotEmpty() && curIndex < questionsList.size) {
            repository.writeActiveSessionToFirestore(
                sessionId = sessionId,
                operation = activeOperation,
                currentIndex = curIndex,
                currentQuestion = questionsList[curIndex]
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column(
                        modifier = Modifier.clickable {
                            val now = System.currentTimeMillis()
                            if (now - lastTapTime < 2500) {
                                devTapCount++
                                if (devTapCount >= 5) {
                                    isDeveloperModeActivated = !isDeveloperModeActivated
                                    devTapCount = 0
                                    onShowToast(if (isDeveloperModeActivated) "डेवलपर मोड एक्टिवेट हो गया है!" else "डेवलपर मोड बंद कर दिया गया है")
                                }
                            } else {
                                devTapCount = 1
                            }
                            lastTapTime = now
                        }
                    ) {
                        Text("RPSC AI-Quizzer", fontWeight = FontWeight.Bold, color = Color(0xFF1E293B), fontSize = 16.sp)
                        Text("Package: com.rpsc.quizapp", fontSize = 10.sp, color = Color(0xFF64748B), fontFamily = FontFamily.Monospace)
                    }
                },
                actions = {
                    if (isDeveloperModeActivated) {
                        IconButton(onClick = { showConsoleHud = !showConsoleHud }) {
                            Icon(
                                imageVector = Icons.Default.Build,
                                contentDescription = "Toggle HUD Console",
                                tint = if (showConsoleHud) Color(0xFF0F766E) else Color(0xFF64748B)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            // HUD Monitor Terminal overlay
            AnimatedVisibility(
                visible = isDeveloperModeActivated && showConsoleHud,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A), RoundedCornerShape(12.dp))
                        .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.KeepDuringLookahead
                    ) {
                        Text(
                            "🌐 FIRESTORE SYNC HUD MONITOR",
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF34D399),
                            fontSize = 11.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Session ID: $sessionId", fontFamily = FontFamily.Monospace, color = Color(0xFF94A3B8), fontSize = 10.sp)
                    Text("Sync OP: $activeOperation", fontFamily = FontFamily.Monospace, color = Color(0xFF38BDF8), fontSize = 10.sp)
                    Text("Index Location: $curIndex", fontFamily = FontFamily.Monospace, color = Color(0xFFF59E0B), fontSize = 10.sp)
                    
                    if (questionsList.isNotEmpty() && curIndex < questionsList.size) {
                        val currentQ = questionsList[curIndex]
                        Text("Current MCQ custom flag: ${currentQ.is_custom}", fontFamily = FontFamily.Monospace, color = Color(0xFFEC4899), fontSize = 10.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Divider(color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Firestore Payload Schema Preview (JSON): \n" +
                            "{\n" +
                            "  \"session_id\": \"$sessionId\",\n" +
                            "  \"operation\": \"$activeOperation\",\n" +
                            "  \"current_index\": $curIndex,\n" +
                            "  \"quiz_data\": {\n" +
                            "    \"question\": \"${currentQ.question.take(50)}...\",\n" +
                            "    \"is_custom\": ${currentQ.is_custom}\n" +
                            "  }\n" +
                            "}",
                            fontFamily = FontFamily.Monospace,
                            color = Color(0xFF10B981),
                            fontSize = 8.sp,
                            lineHeight = 10.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main MCQ Quiz Area
            if (questionsList.isNotEmpty() && curIndex < questionsList.size) {
                val currentQ = questionsList[curIndex]

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                if (currentQ.is_custom == true) "★ CUSTOM MCQ INJECTION" else "RPSC OFFICAL",
                                color = if (currentQ.is_custom == true) Color(0xFFD97706) else Color(0xFF2563EB),
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                "Question ${curIndex + 1} of ${questionsList.size}",
                                fontSize = 11.sp,
                                color = Color(0xFF64748B)
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = currentQ.question,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF0F172A),
                            fontStyle = FontStyle.Normal
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Render options
                        listOf("A" to currentQ.options.A, "B" to currentQ.options.B, "C" to currentQ.options.C, "D" to currentQ.options.D).forEach { (optKey, optText) ->
                            val isSelected = userAnswers[curIndex] == optKey
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                                    .background(
                                        if (isSelected) Color(0xFFEFF6FF) else Color(0xFFF1F5F9),
                                        RoundedCornerShape(8.dp)
                                    )
                                    .border(
                                        1.dp,
                                        if (isSelected) Color(0xFF3B82F6) else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .clickable {
                                        val newAnswers = userAnswers.toMutableMap()
                                        newAnswers[curIndex] = optKey
                                        userAnswers = newAnswers
                                        
                                        // Save progress locally on action (prevents sudden termination loss)
                                        repository.saveProgressLocal(sessionId, questionsList, curIndex, newAnswers)
                                    }
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "$optKey: $optText",
                                    color = if (isSelected) Color(0xFF1D4ED8) else Color(0xFF334155),
                                    fontSize = 13.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(20.dp))

                        // Controls
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Button(
                                onClick = { if (curIndex > 0) curIndex-- },
                                enabled = curIndex > 0,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Prev")
                            }

                            // Inject Pop-Up Trigger Button
                            Button(
                                onClick = { showInjectDialog = true },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0D9488)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "", modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Inject MCQ", fontSize = 12.sp)
                            }

                            Button(
                                onClick = { if (curIndex < questionsList.size - 1) curIndex++ },
                                enabled = curIndex < questionsList.size - 1,
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Next")
                            }
                        }
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = Color(0xFF3B82F6))
                }
            }
        }
    }

    // POP-UP QUESTION INJECTION ALERT DIALOG
    if (showInjectDialog) {
        AlertDialog(
            onDismissRequest = { 
                showInjectDialog = false
                customTextPrompt = ""
            },
            title = {
                Text("Inject Custom Question", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column {
                    Text(
                        "Input a syllabus key or phrase. Core AI Engine will format it into a full MCQ and insert it immediately as the next card in line.",
                        color = Color.Gray,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    OutlinedTextField(
                        value = customTextPrompt,
                        onValueChange = { customTextPrompt = it },
                        placeholder = { Text("e.g. Pushkar lake details or Ranthambore state rule...") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (customTextPrompt.isNotBlank()) {
                            activeOperation = "POPUP_INJECT"
                            repository.formatPromptToMcq(customTextPrompt) { newMcq ->
                                val updated = questionsList.toMutableList()
                                val targetIdx = curIndex + 1
                                updated.add(targetIdx, newMcq)
                                questionsList = updated
                                curIndex = targetIdx // auto advance to injected item
                                
                                // Reset state
                                showInjectDialog = false
                                customTextPrompt = ""
                                onShowToast("Successfully Injected Custom MCQ at Card #${targetIdx+1}!")
                            }
                        }
                    }
                ) {
                    Text("Format & Inject", color = Color(0xFF0F766E), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showInjectDialog = false; customTextPrompt = "" }) {
                    Text("Cancel", color = Color.Gray)
                }
            }
        )
    }
}
