package com.wordquiz.data.repository

import com.wordquiz.data.db.WordDao
import com.wordquiz.data.model.Word

class WordRepository(private val wordDao: WordDao) {
    fun getWordsByUnitId(unitId: Long) = wordDao.getWordsByUnitId(unitId)

    suspend fun getWordsByUnitIds(unitIds: List<Long>): List<Word> {
        return wordDao.getWordsByUnitIds(unitIds)
    }

    suspend fun getWordsByIds(wordIds: List<Long>): List<Word> {
        return wordDao.getWordsByIds(wordIds)
    }

    suspend fun getWordById(id: Long): Word? {
        return wordDao.getWordById(id)
    }

    suspend fun insertWord(word: Word): Long {
        return wordDao.insertWord(word)
    }

    suspend fun insertWords(words: List<Word>) {
        wordDao.insertWords(words)
    }

    suspend fun updateWord(word: Word) {
        wordDao.updateWord(word)
    }

    suspend fun deleteWord(word: Word) {
        wordDao.deleteWord(word)
    }

    suspend fun getWordsCount(): Int {
        return wordDao.getWordsCount()
    }

    suspend fun getWordsCountByUnitId(unitId: Long): Int {
        return wordDao.getWordsCountByUnitId(unitId)
    }

    suspend fun updateWordOrderIndex(id: Long, orderIndex: Int) {
        wordDao.updateWordOrderIndex(id, orderIndex)
    }
}
