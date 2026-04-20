package com.wordquiz.data.db

import androidx.room.*
import com.wordquiz.data.model.Textbook
import kotlinx.coroutines.flow.Flow

@Dao
interface TextbookDao {
    @Query("SELECT * FROM textbooks ORDER BY orderIndex ASC, createdAt ASC")
    fun getAllTextbooks(): Flow<List<Textbook>>

    @Query("SELECT * FROM textbooks WHERE id = :id")
    suspend fun getTextbookById(id: Long): Textbook?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTextbook(textbook: Textbook): Long

    @Update
    suspend fun updateTextbook(textbook: Textbook)

    @Delete
    suspend fun deleteTextbook(textbook: Textbook)

    @Query("SELECT COUNT(*) FROM textbooks")
    suspend fun getTextbooksCount(): Int

    @Query("UPDATE textbooks SET orderIndex = :orderIndex WHERE id = :id")
    suspend fun updateTextbookOrderIndex(id: Long, orderIndex: Int)
}
