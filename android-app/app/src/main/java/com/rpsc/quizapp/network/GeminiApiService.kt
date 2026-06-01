package com.rpsc.quizapp.network

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

// Models matching the Google Gemini JSON payload syntax
data class GeminiRequest(
    val contents: List<Content>,
    val generationConfig: GenerationConfig? = null
)

data class Content(
    val parts: List<Part>
)

data class Part(
    val text: String
)

data class GenerationConfig(
    val responseMimeType: String? = null
)

data class GeminiResponse(
    val candidates: List<Candidate>? = null
)

data class Candidate(
    val content: ResponseContent? = null
)

data class ResponseContent(
    val parts: List<ResponsePart>? = null
)

data class ResponsePart(
    val text: String? = null
)

interface GeminiApiService {
    /**
     * Standard Google AI stable pattern:
     * POST https://generativelanguage.googleapis.com/v1/models/{model}:generateContent?key={key}
     */
    @POST("v1/models/{model}:generateContent")
    fun generateContent(
        @Path("model") model: String,
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): Call<GeminiResponse>
}
