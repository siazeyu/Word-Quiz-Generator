from flask import Blueprint, jsonify, request
from db import get_db

bp = Blueprint('units', __name__)

@bp.route('/api/textbooks/<int:textbook_id>/units', methods=['GET'])
def get_units(textbook_id):
    db = get_db()
    units = db.execute('''
    SELECT * FROM units WHERE textbook_id = ? ORDER BY order_index ASC, created_at ASC
    ''', (textbook_id,)).fetchall()
    
    result = []
    for unit in units:
        result.append({
            'id': unit['id'],
            'textbookId': unit['textbook_id'],
            'name': unit['name'],
            'orderIndex': unit['order_index'],
            'createdAt': unit['created_at'],
            'updatedAt': unit['updated_at']
        })
    
    return jsonify(result)

@bp.route('/api/textbooks/<int:textbook_id>/units', methods=['POST'])
def create_unit(textbook_id):
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({'error': 'Name is required'}), 400
    
    db = get_db()
    
    # 检查教材是否存在
    textbook = db.execute('''
    SELECT * FROM textbooks WHERE id = ?
    ''', (textbook_id,)).fetchone()
    
    if not textbook:
        return jsonify({'error': 'Textbook not found'}), 404
    
    # 获取当前最大的order_index
    max_index = db.execute('''
    SELECT COALESCE(MAX(order_index), -1) as max_index FROM units WHERE textbook_id = ?
    ''', (textbook_id,)).fetchone()['max_index']
    
    try:
        db.execute('''
        INSERT INTO units (textbook_id, name, order_index)
        VALUES (?, ?, ?)
        ''', (textbook_id, data['name'], max_index + 1))
        db.commit()
        
        # 获取新创建的单元
        new_unit = db.execute('''
        SELECT * FROM units WHERE id = last_insert_rowid()
        ''').fetchone()
        
        return jsonify({
            'id': new_unit['id'],
            'textbookId': new_unit['textbook_id'],
            'name': new_unit['name'],
            'orderIndex': new_unit['order_index'],
            'createdAt': new_unit['created_at'],
            'updatedAt': new_unit['updated_at']
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/units/reorder', methods=['POST'])
def reorder_units():
    data = request.get_json()
    if not data or 'items' not in data:
        return jsonify({'error': 'Items are required'}), 400
    
    db = get_db()
    try:
        for item in data['items']:
            db.execute('''
            UPDATE units SET order_index = ? WHERE id = ?
            ''', (item['orderIndex'], item['id']))
        db.commit()
        return jsonify({'ok': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/units/<int:id>', methods=['PATCH'])
def update_unit(id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data is required'}), 400
    
    db = get_db()
    unit = db.execute('''
    SELECT * FROM units WHERE id = ?
    ''', (id,)).fetchone()
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    try:
        update_data = []
        update_fields = []
        
        if 'name' in data:
            update_fields.append('name = ?')
            update_data.append(data['name'])
        
        update_data.append(id)
        
        db.execute(f'''
        UPDATE units SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        ''', update_data)
        db.commit()
        
        updated_unit = db.execute('''
        SELECT * FROM units WHERE id = ?
        ''', (id,)).fetchone()
        
        return jsonify({
            'id': updated_unit['id'],
            'textbookId': updated_unit['textbook_id'],
            'name': updated_unit['name'],
            'orderIndex': updated_unit['order_index'],
            'createdAt': updated_unit['created_at'],
            'updatedAt': updated_unit['updated_at']
        })
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/api/units/<int:id>', methods=['DELETE'])
def delete_unit(id):
    db = get_db()
    unit = db.execute('''
    SELECT * FROM units WHERE id = ?
    ''', (id,)).fetchone()
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    try:
        db.execute('''
        DELETE FROM units WHERE id = ?
        ''', (id,))
        db.commit()
        return '', 204
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500