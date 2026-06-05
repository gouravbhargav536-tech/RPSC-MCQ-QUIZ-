package com.rpsc.quizapp.network

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    // Supported Google Gemini Production IDs: "gemini-1.5-flash" and "gemini-1.5-pro"
    val SUPPORTED_MODELS = arrayOf("gemini-1.5-flash", "gemini-1.5-pro")

    val service: GeminiApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(GeminiApiService::class.java)
    }
}
