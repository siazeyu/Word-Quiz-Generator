package com.wordquiz.data.repository

import com.wordquiz.data.db.TextbookDao
import com.wordquiz.data.model.Textbook
import kotlinx.coroutines.flow.Flow

class TextbookRepository(private val textbookDao: TextbookDao) {
    val allTextbooks: Flow<List<Textbook>> = textbookDao.getAllTextbooks()

    suspend fun getTextbookById(id: Long): Textbook? {
        return textbookDao.getTextbookById(id)
    }

    suspend fun insertTextbook(textbook: Textbook): Long {
        return textbookDao.insertTextbook(textbook)
    }

    suspend fun updateTextbook(textbook: Textbook) {
        textbookDao.updateTextbook(textbook)
    }

    suspend fun deleteTextbook(textbook: Textbook) {
        textbookDao.deleteTextbook(textbook)
    }

    suspend fun getTextbooksCount(): Int {
        return textbookDao.getTextbooksCount()
    }

    suspend fun updateTextbookOrderIndex(id: Long, orderIndex: Int) {
        textbookDao.updateTextbookOrderIndex(id, orderIndex)
    }
}
