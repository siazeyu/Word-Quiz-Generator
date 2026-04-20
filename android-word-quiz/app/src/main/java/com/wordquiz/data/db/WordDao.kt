package com.wordquiz.data.db

import androidx.room.*
import com.wordquiz.data.model.Word
import kotlinx.coroutines.flow.Flow

@Dao
interface WordDao {
    @Query("SELECT * FROM words WHERE unitId = :unitId ORDER BY orderIndex ASC, createdAt ASC")
    fun getWordsByUnitId(unitId: Long): Flow<List<Word>>

    @Query("SELECT * FROM words WHERE unitId IN (:unitIds) ORDER BY unitId ASC, orderIndex ASC")
    suspend fun getWordsByUnitIds(unitIds: List<Long>): List<Word>

    @Query("SELECT * FROM words WHERE id IN (:wordIds) ORDER BY unitId ASC, orderIndex ASC")
    suspend fun getWordsByIds(wordIds: List<Long>): List<Word>

    @Query("SELECT * FROM words WHERE id = :id")
    suspend fun getWordById(id: Long): Word?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWord(word: Word): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertWords(words: List<Word>)

    @Update
    suspend fun updateWord(word: Word)

    @Delete
    suspend fun deleteWord(word: Word)

    @Query("SELECT COUNT(*) FROM words")
    suspend fun getWordsCount(): Int

    @Query("SELECT COUNT(*) FROM words WHERE unitId = :unitId")
    suspend fun getWordsCountByUnitId(unitId: Long): Int

    @Query("UPDATE words SET orderIndex = :orderIndex WHERE id = :id")
    suspend fun updateWordOrderIndex(id: Long, orderIndex: Int)
}
