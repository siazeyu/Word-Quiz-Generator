from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint('textbooks', __name__)

@bp.route('/api/textbooks', methods=['GET'])
def get_textbooks():
    db = get_db()
    textbooks = db.execute('''
    SELECT * FROM textbooks ORDER BY order_index ASC, created_at ASC
    ''').fetchall()
    
    result = []
    for textbook in textbooks:
        result.append({
            'id': textbook['id'],
            'name': textbook['name'],
            'description': textbook['description'],
            'orderIndex': textbook['order_index'],
            'createdAt': textbook['created_at'],
            'updatedAt': textbook['updated_at']
        })
    
    return jsonify(result)

@bp.route('/api/textbooks', methods=['POST'])
def create_textbook():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    db = get_db()
    
    # 获取当前最大的order_index
    max_index = db.execute('''
    SELECT COALESCE(MAX(order_index), -1) as max_index FROM textbooks
    ''').fetchone()['max_index']
    
    try:
        db.execute('''
        INSERT INTO textbooks (name, description, order_index)
        VALUES (?, ?, ?)
        ''', (data['name'], data.get('description'), max_index + 1))
        db.commit()
        
        # 获取新创建的教材
        new_textbook = db.execute('''
        SELECT * FROM textbooks WHERE id = last_insert_rowid()
        ''').fetchone()
        
        return jsonify({
            'id': new_textbook['id'],
            'name': new_textbook['name'],
            'description': new_textbook['description'],
            'orderIndex': new_textbook['order_index'],
            'createdAt': new_textbook['created_at'],
            'updatedAt': new_textbook['updated_at']
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/textbooks/reorder', methods=['POST'])
def reorder_textbooks():
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({'error': 'Items are required'}), 400
    
    db = get_db()
    try:
        for item in data['items']:
            db.execute('''
            UPDATE textbooks SET order_index = ? WHERE id = ?
            ''', (item['orderIndex'], item['id']))
        db.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/textbooks/<int:id>', methods=['GET'])
def get_textbook(id):
    db = get_db()
    textbook = db.execute('''
    SELECT * FROM textbooks WHERE id = ?
    ''', (id,)).fetchone()
    
    if not textbook:
        return jsonify({'error': 'Textbook not found'}), 404
    
    return jsonify({
        'id': textbook['id'],
        'name': textbook['name'],
        'description': textbook['description'],
        'orderIndex': textbook['order_index'],
        'createdAt': textbook['created_at'],
        'updatedAt': textbook['updated_at']
    })

@bp.route('/api/textbooks/<int:id>', methods=['PATCH'])
def update_textbook(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data is required'}), 400
    
    db = get_db()
    textbook = db.execute('''
    SELECT * FROM textbooks WHERE id = ?
    ''', (id,)).fetchone()
    
    if not textbook:
        return jsonify({'error': 'Textbook not found'}), 404
    
    try:
        update_data = []
        update_fields = []
        
        if 'name' in data:
            update_fields.append('name = ?')
            update_data.append(data['name'])
        if 'description' in data:
            update_fields.append('description = ?')
            update_data.append(data['description'])
        
        update_data.append(id)
        
        db.execute(f'''
        UPDATE textbooks SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', update_data)
        db.commit()
        
        updated_textbook = db.execute('''
        SELECT * FROM textbooks WHERE id = ?
        ''', (id,)).fetchone()
        
        return jsonify({
            'id': updated_textbook['id'],
            'name': updated_textbook['name'],
            'description': updated_textbook['description'],
            'orderIndex': updated_textbook['order_index'],
            'createdAt': updated_textbook['created_at'],
            'updatedAt': updated_textbook['updated_at']
        })
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/textbooks/<int:id>', methods=['DELETE'])
def delete_textbook(id):
    db = get_db()
    textbook = db.execute('''
    SELECT * FROM textbooks WHERE id = ?
    ''', (id,)).fetchone()
    
    if not textbook:
        return jsonify({'error': 'Textbook not found'}), 404
    
    try:
        db.execute('''
        DELETE FROM textbooks WHERE id = ?
        ''', (id,))
        db.commit()
        return '', 204
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/stats/summary', methods=['GET'])
def get_stats_summary():
    db = get_db()
    
    textbooks_count = db.execute('''
    SELECT COUNT(*) as count FROM textbooks
    ''').fetchone()['count']
    
    units_count = db.execute('''
    SELECT COUNT(*) as count FROM units
    ''').fetchone()['count']
    
    words_count = db.execute('''
    SELECT COUNT(*) as count FROM words
    ''').fetchone()['count']
    
    return jsonify({
        'totalTextbooks': textbooks_count,
        'totalUnits': units_count,
        'totalWords': words_count
    })