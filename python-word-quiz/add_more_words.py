import sqlite3
import os

DB_PATH = os.path.join('db', 'word_quiz.db')

# 额外的单词
extra_words = [
    ('pencil', '铅笔', '/ˈpensl/', 'noun'),
    ('eraser', '橡皮', '/ɪˈreɪzə/', 'noun')
]

def add_extra_words():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 获取当前最大的order_index
        cursor.execute("SELECT COALESCE(MAX(order_index), -1) as max_index FROM words WHERE unit_id = 1")
        max_index = cursor.fetchone()[0]
        
        # 添加额外的单词
        for i, (english, chinese, phonetic, part_of_speech) in enumerate(extra_words):
            cursor.execute("INSERT INTO words (unit_id, english, chinese, phonetic, part_of_speech, order_index) VALUES (?, ?, ?, ?, ?, ?)",
                          (1, english, chinese, phonetic, part_of_speech, max_index + 1 + i))
        
        conn.commit()
        print(f"添加了 {len(extra_words)} 个额外单词")
        print("现在总共有 100 个单词！")
        
    except Exception as e:
        conn.rollback()
        print(f"错误: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    add_extra_words()