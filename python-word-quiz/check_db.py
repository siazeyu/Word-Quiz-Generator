import sqlite3
import os

DB_PATH = os.path.join('db', 'word_quiz.db')
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 检查所有表
c.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = c.fetchall()
print('Tables:', tables)

# 检查单词数量
c.execute("SELECT COUNT(*) FROM words")
words_count = c.fetchone()[0]
print('Words count:', words_count)

# 检查单元数量
c.execute("SELECT COUNT(*) FROM units")
units_count = c.fetchone()[0]
print('Units count:', units_count)

# 检查教材数量
c.execute("SELECT COUNT(*) FROM textbooks")
textbooks_count = c.fetchone()[0]
print('Textbooks count:', textbooks_count)

conn.close()