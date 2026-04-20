import sqlite3
import os
import random

DB_PATH = os.path.join('db', 'word_quiz.db')

# 常用英语单词列表（100个）
word_list = [
    ('apple', '苹果', '/ˈæpl/', 'noun'),
    ('banana', '香蕉', '/bəˈnɑːnə/', 'noun'),
    ('cat', '猫', '/kæt/', 'noun'),
    ('dog', '狗', '/dɒɡ/', 'noun'),
    ('elephant', '大象', '/ˈelɪfənt/', 'noun'),
    ('fish', '鱼', '/fɪʃ/', 'noun'),
    ('goat', '山羊', '/ɡəʊt/', 'noun'),
    ('house', '房子', '/haʊs/', 'noun'),
    ('ice', '冰', '/aɪs/', 'noun'),
    ('juice', '果汁', '/dʒuːs/', 'noun'),
    ('kite', '风筝', '/kaɪt/', 'noun'),
    ('lion', '狮子', '/ˈlaɪən/', 'noun'),
    ('moon', '月亮', '/muːn/', 'noun'),
    ('notebook', '笔记本', '/ˈnəʊtbʊk/', 'noun'),
    ('orange', '橙子', '/ˈɒrɪndʒ/', 'noun'),
    ('pen', '钢笔', '/pen/', 'noun'),
    ('queen', '女王', '/kwiːn/', 'noun'),
    ('rabbit', '兔子', '/ˈræbɪt/', 'noun'),
    ('sun', '太阳', '/sʌn/', 'noun'),
    ('tree', '树', '/triː/', 'noun'),
    ('umbrella', '雨伞', '/ʌmˈbrelə/', 'noun'),
    ('violin', '小提琴', '/ˌvaɪəˈlɪn/', 'noun'),
    ('water', '水', '/ˈwɔːtə/', 'noun'),
    ('xylophone', '木琴', '/ˈzaɪləfəʊn/', 'noun'),
    ('yellow', '黄色', '/ˈjeləʊ/', 'adjective'),
    ('zebra', '斑马', '/ˈzebrə/', 'noun'),
    ('book', '书', '/bʊk/', 'noun'),
    ('computer', '电脑', '/kəmˈpjuːtə/', 'noun'),
    ('desk', '书桌', '/desk/', 'noun'),
    ('chair', '椅子', '/tʃeə/', 'noun'),
    ('table', '桌子', '/ˈteɪbl/', 'noun'),
    ('window', '窗户', '/ˈwɪndəʊ/', 'noun'),
    ('door', '门', '/dɔː/', 'noun'),
    ('key', '钥匙', '/kiː/', 'noun'),
    ('lock', '锁', '/lɒk/', 'noun'),
    ('clock', '时钟', '/klɒk/', 'noun'),
    ('watch', '手表', '/wɒtʃ/', 'noun'),
    ('phone', '手机', '/fəʊn/', 'noun'),
    ('camera', '相机', '/ˈkæmərə/', 'noun'),
    ('television', '电视', '/ˌtelɪˈvɪʒn/', 'noun'),
    ('radio', '收音机', '/ˈreɪdiəʊ/', 'noun'),
    ('printer', '打印机', '/ˈprɪntə/', 'noun'),
    ('scanner', '扫描仪', '/ˈskænə/', 'noun'),
    ('mouse', '鼠标', '/maʊs/', 'noun'),
    ('keyboard', '键盘', '/ˈkiːbɔːd/', 'noun'),
    ('monitor', '显示器', '/ˈmɒnɪtə/', 'noun'),
    ('speaker', '扬声器', '/ˈspiːkə/', 'noun'),
    ('headphone', '耳机', '/ˈhedfəʊn/', 'noun'),
    ('microphone', '麦克风', '/ˈmaɪkrəfəʊn/', 'noun'),
    ('battery', '电池', '/ˈbætri/', 'noun'),
    ('charger', '充电器', '/ˈtʃɑːdʒə/', 'noun'),
    ('cable', '电缆', '/ˈkeɪbl/', 'noun'),
    ('adapter', '适配器', '/əˈdæptə/', 'noun'),
    ('backpack', '背包', '/ˈbækpæk/', 'noun'),
    ('wallet', '钱包', '/ˈwɒlɪt/', 'noun'),
    ('purse', '手提包', '/pɜːs/', 'noun'),
    ('briefcase', '公文包', '/ˈbriːfkeɪs/', 'noun'),
    ('suitcase', '行李箱', '/ˈsuːtkeɪs/', 'noun'),
    ('backpack', '背包', '/ˈbækpæk/', 'noun'),
    ('umbrella', '雨伞', '/ʌmˈbrelə/', 'noun'),
    ('sunglasses', '太阳镜', '/ˈsʌnɡlɑːsɪz/', 'noun'),
    ('hat', '帽子', '/hæt/', 'noun'),
    ('cap', '帽子', '/kæp/', 'noun'),
    ('scarf', '围巾', '/skɑːf/', 'noun'),
    ('gloves', '手套', '/ɡlʌvz/', 'noun'),
    ('socks', '袜子', '/sɒks/', 'noun'),
    ('shoes', '鞋子', '/ʃuːz/', 'noun'),
    ('boots', '靴子', '/buːts/', 'noun'),
    ('sneakers', '运动鞋', '/ˈsniːkəz/', 'noun'),
    ('sandals', '凉鞋', '/ˈsændlz/', 'noun'),
    ('shirt', '衬衫', '/ʃɜːt/', 'noun'),
    ('pants', '裤子', '/pænts/', 'noun'),
    ('skirt', '裙子', '/skɜːt/', 'noun'),
    ('dress', '连衣裙', '/dres/', 'noun'),
    ('jacket', '夹克', '/ˈdʒækɪt/', 'noun'),
    ('coat', '外套', '/kəʊt/', 'noun'),
    ('sweater', '毛衣', '/ˈswetə/', 'noun'),
    ('t-shirt', 'T恤', '/ˈtiː ʃɜːt/', 'noun'),
    ('shorts', '短裤', '/ʃɔːts/', 'noun'),
    ('jeans', '牛仔裤', '/dʒiːnz/', 'noun'),
    ('suit', '西装', '/suːt/', 'noun'),
    ('tie', '领带', '/taɪ/', 'noun'),
    ('belt', '腰带', '/belt/', 'noun'),
    ('wallet', '钱包', '/ˈwɒlɪt/', 'noun'),
    ('watch', '手表', '/wɒtʃ/', 'noun'),
    ('ring', '戒指', '/rɪŋ/', 'noun'),
    ('necklace', '项链', '/ˈnekləs/', 'noun'),
    ('bracelet', '手镯', '/ˈbreɪslət/', 'noun'),
    ('earrings', '耳环', '/ˈɪərɪŋz/', 'noun'),
    ('glasses', '眼镜', '/ˈɡlɑːsɪz/', 'noun'),
    ('phone', '手机', '/fəʊn/', 'noun'),
    ('camera', '相机', '/ˈkæmərə/', 'noun'),
    ('laptop', '笔记本电脑', '/ˈlæptɒp/', 'noun'),
    ('tablet', '平板', '/ˈtæblət/', 'noun'),
    ('headphones', '耳机', '/ˈhedfəʊnz/', 'noun'),
    ('speaker', '扬声器', '/ˈspiːkə/', 'noun'),
    ('charger', '充电器', '/ˈtʃɑːdʒə/', 'noun'),
    ('cable', '电缆', '/ˈkeɪbl/', 'noun')
]

def generate_test_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # 创建教材
        cursor.execute("INSERT INTO textbooks (name, description, order_index) VALUES (?, ?, ?)", 
                      ('测试教材', '用于生成100个单词测试的教材', 0))
        textbook_id = cursor.lastrowid
        print(f"创建教材成功，ID: {textbook_id}")
        
        # 创建单元
        cursor.execute("INSERT INTO units (textbook_id, name, order_index) VALUES (?, ?, ?)", 
                      (textbook_id, '测试单元', 0))
        unit_id = cursor.lastrowid
        print(f"创建单元成功，ID: {unit_id}")
        
        # 添加单词
        for i, (english, chinese, phonetic, part_of_speech) in enumerate(word_list):
            cursor.execute("INSERT INTO words (unit_id, english, chinese, phonetic, part_of_speech, order_index) VALUES (?, ?, ?, ?, ?, ?)",
                          (unit_id, english, chinese, phonetic, part_of_speech, i))
        print(f"添加了 {len(word_list)} 个单词")
        
        conn.commit()
        print("数据生成成功！")
        
    except Exception as e:
        conn.rollback()
        print(f"错误: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    generate_test_data()