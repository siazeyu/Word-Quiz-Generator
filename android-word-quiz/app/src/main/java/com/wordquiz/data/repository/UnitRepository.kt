package com.wordquiz.data.repository

import com.wordquiz.data.db.UnitDao
import com.wordquiz.data.model.Unit
import kotlinx.coroutines.flow.Flow

class UnitRepository(private val unitDao: UnitDao) {
    fun getUnitsByTextbookId(textbookId: Long): Flow<List<Unit>> {
        return unitDao.getUnitsByTextbookId(textbookId)
    }

    suspend fun getUnitById(id: Long): Unit? {
        return unitDao.getUnitById(id)
    }

    suspend fun insertUnit(unit: Unit): Long {
        return unitDao.insertUnit(unit)
    }

    suspend fun updateUnit(unit: Unit) {
        unitDao.updateUnit(unit)
    }

    suspend fun deleteUnit(unit: Unit) {
        unitDao.deleteUnit(unit)
    }

    suspend fun getUnitsCount(): Int {
        return unitDao.getUnitsCount()
    }

    suspend fun getUnitsCountByTextbookId(textbookId: Long): Int {
        return unitDao.getUnitsCountByTextbookId(textbookId)
    }

    suspend fun updateUnitOrderIndex(id: Long, orderIndex: Int) {
        unitDao.updateUnitOrderIndex(id, orderIndex)
    }
}
