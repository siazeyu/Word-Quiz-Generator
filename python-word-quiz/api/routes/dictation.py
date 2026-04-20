from flask import Blueprint, jsonify, request
from db import get_db
import random
from datetime import datetime

bp = Blueprint('dictation', __name__)

@bp.route('/api/dictation/preview', methods=['POST'])
def generate_dictation_preview():
    data = request.get_json()
    if not data or 'unitIds' not in data:
        return jsonify({'error': 'UnitIds are required'}), 400
    
    unit_ids = data['unitIds']
    direction = data.get('direction', 'zh_to_en')
    style = data.get('style', 'underline')
    shuffle = data.get('shuffle', False)
    show_phonetic = data.get('showPhonetic', True)
    title = data.get('title', '默写练习')
    
    db = get_db()
    
    # 获取指定单元的所有单词
    placeholders = ','.join(['?'] * len(unit_ids))
    words = db.execute(f'''
    SELECT * FROM words WHERE unit_id IN ({placeholders}) ORDER BY unit_id ASC, order_index ASC
    ''', unit_ids).fetchall()
    
    items = []
    for word in words:
        item = {
            'prompt': word['chinese'] if direction == 'zh_to_en' else word['english'],
            'answer': word['english'] if direction == 'zh_to_en' else word['chinese'],
            'phonetic': word['phonetic'],
            'partOfSpeech': word['part_of_speech']
        }
        items.append(item)
    
    if shuffle:
        random.shuffle(items)
    
    if not show_phonetic:
        for item in items:
            item['phonetic'] = None
    
    return jsonify({
        'title': title,
        'direction': direction,
        'style': style,
        'items': items,
        'generatedAt': datetime.now().isoformat()
    })

@bp.route('/api/dictation/preview-by-ids', methods=['POST'])
def generate_dictation_preview_by_ids():
    data = request.get_json()
    if not data or 'wordIds' not in data:
        return jsonify({'error': 'WordIds are required'}), 400
    
    word_ids = data['wordIds']
    direction = data.get('direction', 'zh_to_en')
    style = data.get('style', 'underline')
    show_phonetic = data.get('showPhonetic', True)
    title = data.get('title', '默写练习')
    shuffle = data.get('shuffle', False)
    random_count = data.get('randomCount')
    
    db = get_db()
    
    # 获取指定ID的单词
    placeholders = ','.join(['?'] * len(word_ids))
    words = db.execute(f'''
    SELECT * FROM words WHERE id IN ({placeholders}) ORDER BY unit_id ASC, order_index ASC
    ''', word_ids).fetchall()
    
    # 按照word_ids的顺序排序
    word_dict = {word['id']: word for word in words}
    ordered_words = [word_dict.get(word_id) for word_id in word_ids if word_dict.get(word_id)]
    
    if shuffle:
        random.shuffle(ordered_words)
    
    if random_count and random_count < len(ordered_words):
        ordered_words = ordered_words[:random_count]
    
    items = []
    for word in ordered_words:
        item = {
            'prompt': word['chinese'] if direction == 'zh_to_en' else word['english'],
            'answer': word['english'] if direction == 'zh_to_en' else word['chinese'],
            'phonetic': word['phonetic'],
            'partOfSpeech': word['part_of_speech']
        }
        items.append(item)
    
    if not show_phonetic:
        for item in items:
            item['phonetic'] = None
    
    return jsonify({
        'title': title,
        'direction': direction,
        'style': style,
        'items': items,
        'generatedAt': datetime.now().isoformat()
    })