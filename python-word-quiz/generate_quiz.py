import requests
import json

# Flask 应用的 URL
BASE_URL = 'http://localhost:5000'

def generate_word_quiz():
    # 准备请求数据
    data = {
        'unitIds': [1],  # 测试单元的 ID
        'direction': 'zh_to_en',  # 中文到英文
        'style': 'underline',  # 下划线样式
        'shuffle': True,  # 打乱顺序
        'showPhonetic': True,  # 显示音标
        'title': '100单词测试'
    }
    
    try:
        # 发送请求
        response = requests.post(f'{BASE_URL}/api/dictation/preview', json=data)
        response.raise_for_status()  # 检查请求是否成功
        
        # 解析响应
        quiz_data = response.json()
        
        # 打印测试信息
        print(f"测试标题: {quiz_data['title']}")
        print(f"测试方向: {'中文→英文' if quiz_data['direction'] == 'zh_to_en' else '英文→中文'}")
        print(f"单词数量: {len(quiz_data['items'])}")
        print(f"生成时间: {quiz_data['generatedAt']}")
        print()
        
        # 打印前10个测试题
        print("前10个测试题:")
        for i, item in enumerate(quiz_data['items'][:10], 1):
            print(f"{i}. {item['prompt']}")
            if item['partOfSpeech']:
                print(f"   词性: {item['partOfSpeech']}")
            print(f"   答案: {item['answer']}")
            print()
        
        # 保存测试结果到文件
        with open('word_quiz_result.json', 'w', encoding='utf-8') as f:
            json.dump(quiz_data, f, ensure_ascii=False, indent=2)
        print("测试结果已保存到 word_quiz_result.json 文件")
        
    except requests.RequestException as e:
        print(f"请求失败: {e}")

if __name__ == '__main__':
    generate_word_quiz()