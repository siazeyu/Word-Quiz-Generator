package com.wordquiz

import android.app.Application
import com.wordquiz.data.db.AppDatabase
import com.wordquiz.data.repository.TextbookRepository
import com.wordquiz.data.repository.UnitRepository
import com.wordquiz.data.repository.WordRepository

class WordQuizApp : Application() {
    val database by lazy { AppDatabase.getDatabase(this) }
    val textbookRepository by lazy { TextbookRepository(database.textbookDao()) }
    val unitRepository by lazy { UnitRepository(database.unitDao()) }
    val wordRepository by lazy { WordRepository(database.wordDao()) }
}
