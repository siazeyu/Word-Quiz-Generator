package com.wordquiz.data.db

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.wordquiz.data.model.Textbook
import com.wordquiz.data.model.Unit
import com.wordquiz.data.model.Word

@Database(
    entities = [Textbook::class, Unit::class, Word::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun textbookDao(): TextbookDao
    abstract fun unitDao(): UnitDao
    abstract fun wordDao(): WordDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "word_quiz_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
