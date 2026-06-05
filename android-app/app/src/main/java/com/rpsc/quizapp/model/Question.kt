package com.rpsc.quizapp.model

data class Question(
    val id: String = "",
    val question: String = "",
    val options: Options = Options(),
    val correctAnswer: String = "A",
    val explanation: String = "",
    val is_custom: Boolean = false
)

data class Options(
    val A: String = "",
    val B: String = "",
    val C: String = "",
    val D: String = ""
)
