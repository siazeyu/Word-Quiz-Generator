package com.wordquiz.data.model

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "units",
    foreignKeys = [
        ForeignKey(
            entity = Textbook::class,
            parentColumns = ["id"],
            childColumns = ["textbookId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("textbookId")]
)
data class Unit(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val textbookId: Long,
    val name: String,
    val orderIndex: Int = 0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
