package com.wordquiz.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "textbooks")
data class Textbook(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val description: String? = null,
    val orderIndex: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
