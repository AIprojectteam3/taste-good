# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

# Flask 애플리케이션 생성
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# MySQL 데이터베이스 연결 정보
# 사용자의 실제 DB 정보에 맞게 수정해야 합니다.
db_config = {
    'host': 'localhost',
    'user': 'root',     # 예: 'root'
    'password': '', # 예: 'your_password'
    'database': 'taste_good' # 예: 'eumsig_db'
}

# 데이터베이스 연결을 위한 헬퍼 함수
def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

# =================================================================
# 드롭다운 메뉴를 채우기 위한 API 3개
# =================================================================

# 범용 옵션 조회 API 함수
def get_options(table_name, id_col, kor_col):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스에 연결할 수 없습니다.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        query = f"SELECT {id_col}, {kor_col} FROM {table_name} ORDER BY {id_col}"
        cursor.execute(query)
        options = cursor.fetchall()
        return jsonify(options)
    except Error as e:
        print(f"{table_name} 조회 오류: {e}")
        return jsonify({'message': '데이터를 조회하는 중 오류가 발생했습니다.'}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# 1. '감정/상황' (Need) 목록 API
@app.route('/api/options/needs', methods=['GET'])
def get_needs():
    return get_options('Need', 'NeedID', 'NeedKor')

# 2. '목표' (Goal) 목록 API
@app.route('/api/options/goals', methods=['GET'])
def get_goals():
    return get_options('Goal', 'GoalID', 'GoalKor')

# 3. '날씨' (Weather) 목록 API
@app.route('/api/options/weathers', methods=['GET'])
def get_weathers():
    return get_options('Weather', 'WeatherID', 'WeatherKor')


# =================================================================
# AI 메뉴 추천 API
# =================================================================
@app.route('/api/recommend', methods=['GET'])
def recommend_menu():
    # 1. 프론트엔드에서 전달된 조건 값을 받습니다.
    need_id = request.args.get('need')
    goal_id = request.args.get('goal')
    weather_id = request.args.get('weather')

    if not all([need_id, goal_id, weather_id]):
        return jsonify({'message': '모든 추천 조건을 선택해주세요.'}), 400

    # 2. 조건에 맞는 메뉴를 DB에서 찾는 SQL 쿼리
    query = """
        SELECT DISTINCT
            m.MenuID, m.MenuKor, m.Category, m.kcal, m.Price, m.imagePath
        FROM
            Menu m
        JOIN MenuNeed mn ON m.MenuID = mn.MenuID
        JOIN MenuGoal mg ON m.MenuID = mg.MenuID
        JOIN MenuWeather mw ON m.MenuID = mw.MenuID
        WHERE
            mn.NeedID = %s AND
            mg.GoalID = %s AND
            mw.WeatherID = %s
        ORDER BY RAND()
        LIMIT 12;
    """
    
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스에 연결할 수 없습니다.'}), 500

    try:
        # 3. DB에 연결하고 쿼리를 실행합니다.
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, (need_id, goal_id, weather_id))
        results = cursor.fetchall()
        
        # 4. 조회된 메뉴 목록을 JSON 형태로 프론트엔드에 전달합니다.
        return jsonify(results)
        
    except Error as e:
        print(f"메뉴 추천 쿼리 오류: {e}")
        return jsonify({'message': '추천 메뉴를 불러오는 중 오류가 발생했습니다.'}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# 파이썬 스크립트를 직접 실행할 때 Flask 서버를 구동합니다.
if __name__ == '__main__':
    # debug=True는 개발 중에만 사용하고, 실제 서비스 시에는 False로 변경해야 합니다.
    app.run(debug=True, port=5000)