from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint('words', __name__)

@bp.route('/api/units/<int:unit_id>/words', methods=['GET'])
def get_words(unit_id):
    db = get_db()
    words = db.execute('''
    SELECT * FROM words WHERE unit_id = ? ORDER BY order_index ASC, created_at ASC
    ''', (unit_id,)).fetchall()
    
    result = []
    for word in words:
        result.append({
            'id': word['id'],
            'unitId': word['unit_id'],
            'english': word['english'],
            'chinese': word['chinese'],
            'phonetic': word['phonetic'],
            'partOfSpeech': word['part_of_speech'],
            'orderIndex': word['order_index'],
            'createdAt': word['created_at'],
            'updatedAt': word['updated_at']
        })
    
    return jsonify(result)

@bp.route('/api/units/<int:unit_id>/words', methods=['POST'])
def create_word(unit_id):
    data = request.get_json()
    if not data or 'english' not in data or 'chinese' not in data:
        return jsonify({'error': 'English and Chinese are required'}), 400
    
    db = get_db()
    
    # 检查单元是否存在
    unit = db.execute('''
    SELECT * FROM units WHERE id = ?
    ''', (unit_id,)).fetchone()
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    # 获取当前最大的order_index
    max_index = db.execute('''
    SELECT COALESCE(MAX(order_index), -1) as max_index FROM words WHERE unit_id = ?
    ''', (unit_id,)).fetchone()['max_index']
    
    try:
        db.execute('''
        INSERT INTO words (unit_id, english, chinese, phonetic, part_of_speech, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (unit_id, data['english'], data['chinese'], data.get('phonetic'), data.get('partOfSpeech'), max_index + 1))
        db.commit()
        
        # 获取新创建的单词
        new_word = db.execute('''
        SELECT * FROM words WHERE id = last_insert_rowid()
        ''').fetchone()
        
        return jsonify({
            'id': new_word['id'],
            'unitId': new_word['unit_id'],
            'english': new_word['english'],
            'chinese': new_word['chinese'],
            'phonetic': new_word['phonetic'],
            'partOfSpeech': new_word['part_of_speech'],
            'orderIndex': new_word['order_index'],
            'createdAt': new_word['created_at'],
            'updatedAt': new_word['updated_at']
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/words/reorder', methods=['POST'])
def reorder_words():
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({'error': 'Items are required'}), 400
    
    db = get_db()
    try:
        for item in data['items']:
            db.execute('''
            UPDATE words SET order_index = ? WHERE id = ?
            ''', (item['orderIndex'], item['id']))
        db.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/words/<int:id>', methods=['PATCH'])
def update_word(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data is required'}), 400
    
    db = get_db()
    word = db.execute('''
    SELECT * FROM words WHERE id = ?
    ''', (id,)).fetchone()
    
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    
    try:
        update_data = []
        update_fields = []
        
        if 'english' in data:
            update_fields.append('english = ?')
            update_data.append(data['english'])
        if 'chinese' in data:
            update_fields.append('chinese = ?')
            update_data.append(data['chinese'])
        if 'phonetic' in data:
            update_fields.append('phonetic = ?')
            update_data.append(data['phonetic'])
        if 'partOfSpeech' in data:
            update_fields.append('part_of_speech = ?')
            update_data.append(data['partOfSpeech'])
        
        update_data.append(id)
        
        db.execute(f'''
        UPDATE words SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', update_data)
        db.commit()
        
        updated_word = db.execute('''
        SELECT * FROM words WHERE id = ?
        ''', (id,)).fetchone()
        
        return jsonify({
            'id': updated_word['id'],
            'unitId': updated_word['unit_id'],
            'english': updated_word['english'],
            'chinese': updated_word['chinese'],
            'phonetic': updated_word['phonetic'],
            'partOfSpeech': updated_word['part_of_speech'],
            'orderIndex': updated_word['order_index'],
            'createdAt': updated_word['created_at'],
            'updatedAt': updated_word['updated_at']
        })
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/words/<int:id>', methods=['DELETE'])
def delete_word(id):
    db = get_db()
    word = db.execute('''
    SELECT * FROM words WHERE id = ?
    ''', (id,)).fetchone()
    
    if not word:
        return jsonify({'error': 'Word not found'}), 404
    
    try:
        db.execute('''
        DELETE FROM words WHERE id = ?
        ''', (id,))
        db.commit()
        return '', 204
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/words/import', methods=['POST'])
def import_words():
    data = request.get_json()
    if not data or 'unitId' not in data or 'words' not in data:
        return jsonify({'error': 'UnitId and words are required'}), 400
    
    db = get_db()
    unit_id = data['unitId']
    words_data = data['words']
    
    # 检查单元是否存在
    unit = db.execute('''
    SELECT * FROM units WHERE id = ?
    ''', (unit_id,)).fetchone()
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    # 获取当前最大的order_index
    max_index = db.execute('''
    SELECT COALESCE(MAX(order_index), -1) as max_index FROM words WHERE unit_id = ?
    ''', (unit_id,)).fetchone()['max_index']
    
    imported = 0
    try:
        for word in words_data:
            if 'english' in word and 'chinese' in word:
                max_index += 1
                db.execute('''
                INSERT INTO words (unit_id, english, chinese, phonetic, part_of_speech, order_index)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (unit_id, word['english'], word['chinese'], word.get('phonetic'), word.get('partOfSpeech'), max_index))
                imported += 1
        db.commit()
        return jsonify({'imported': imported, 'total': len(words_data)})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/units/<int:unit_id>/words/export', methods=['GET'])
def export_words(unit_id):
    db = get_db()
    
    # 检查单元是否存在
    unit = db.execute('''
    SELECT * FROM units WHERE id = ?
    ''', (unit_id,)).fetchone()
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    # 获取单词列表
    words = db.execute('''
    SELECT * FROM words WHERE unit_id = ? ORDER BY order_index ASC, created_at ASC
    ''', (unit_id,)).fetchall()
    
    # 获取教材信息
    textbook = db.execute('''
    SELECT * FROM textbooks WHERE id = ?
    ''', (unit['textbook_id'],)).fetchone()
    
    result = []
    for word in words:
        result.append({
            'id': word['id'],
            'unitId': word['unit_id'],
            'english': word['english'],
            'chinese': word['chinese'],
            'phonetic': word['phonetic'],
            'partOfSpeech': word['part_of_speech'],
            'orderIndex': word['order_index'],
            'createdAt': word['created_at'],
            'updatedAt': word['updated_at']
        })
    
    return jsonify({
        'unitName': unit['name'],
        'textbookName': textbook['name'] if textbook else '',
        'words': result
    })