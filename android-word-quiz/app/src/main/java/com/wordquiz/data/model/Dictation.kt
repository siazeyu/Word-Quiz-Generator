package com.wordquiz.data.model

data class DictationItem(
    val prompt: String,
    val answer: String,
    val phonetic: String? = null,
    val partOfSpeech: String? = null
)

data class DictationPreview(
    val title: String,
    val direction: String,
    val style: String,
    val items: List<DictationItem>,
    val totalItems: Int,
    val totalPages: Int,
    val currentPage: Int,
    val pageSize: Int,
    val generatedAt: String
)

data class StatsSummary(
    val totalTextbooks: Int,
    val totalUnits: Int,
    val totalWords: Int
)
