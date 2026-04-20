from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from db import init_db, get_db
from api.routes import textbooks, units, words, dictation, health
import os

app = Flask(__name__)
CORS(app)

# 设置静态文件目录
app.static_folder = 'static'

# 初始化数据库
init_db()

# 注册路由
app.register_blueprint(health.bp)
app.register_blueprint(textbooks.bp)
app.register_blueprint(units.bp)
app.register_blueprint(words.bp)
app.register_blueprint(dictation.bp)

# 前端路由
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_file(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)