package com.wordquiz.data.db

import androidx.room.*
import com.wordquiz.data.model.Unit
import kotlinx.coroutines.flow.Flow

@Dao
interface UnitDao {
    @Query("SELECT * FROM units WHERE textbookId = :textbookId ORDER BY orderIndex ASC, createdAt ASC")
    fun getUnitsByTextbookId(textbookId: Long): Flow<List<Unit>>

    @Query("SELECT * FROM units WHERE id = :id")
    suspend fun getUnitById(id: Long): Unit?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUnit(unit: Unit): Long

    @Update
    suspend fun updateUnit(unit: Unit)

    @Delete
    suspend fun deleteUnit(unit: Unit)

    @Query("SELECT COUNT(*) FROM units")
    suspend fun getUnitsCount(): Int

    @Query("SELECT COUNT(*) FROM units WHERE textbookId = :textbookId")
    suspend fun getUnitsCountByTextbookId(textbookId: Long): Int

    @Query("UPDATE units SET orderIndex = :orderIndex WHERE id = :id")
    suspend fun updateUnitOrderIndex(id: Long, orderIndex: Int)
}
