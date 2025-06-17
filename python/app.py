# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'taste_good'
}

def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

# 범용 옵션 조회 함수 (수정 없음)
def get_options(query, params=None):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스에 연결할 수 없습니다.'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, params or [])
        options = cursor.fetchall()
        return jsonify(options)
    except Error as e:
        print(f"데이터 조회 오류: {e}")
        return jsonify({'message': '데이터를 조회하는 중 오류가 발생했습니다.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# 카테고리, 상황, 목표, 날씨 API (수정 없음)
@app.route('/api/options/categories', methods=['GET'])
def get_categories():
    query = "SELECT DISTINCT Category FROM Menu WHERE Category IS NOT NULL AND Category != '' ORDER BY Category"
    return get_options(query)

@app.route('/api/options/needs', methods=['GET'])
def get_needs():
    query = "SELECT NeedID, NeedKor FROM Need ORDER BY NeedID"
    return get_options(query)

@app.route('/api/options/goals', methods=['GET'])
def get_goals():
    query = "SELECT GoalID, GoalKor FROM Goal ORDER BY GoalID"
    return get_options(query)

@app.route('/api/options/weathers', methods=['GET'])
def get_weathers():
    query = "SELECT WeatherID, WeatherKor FROM Weather ORDER BY WeatherID"
    return get_options(query)

# === 추천 로직 수정 ===
@app.route('/api/recommend', methods=['GET'])
def recommend_menu():
    # 1. 프론트엔드에서 모든 필터 값 수신 (기존과 동일)
    category_str = request.args.get('category')
    need_ids_str = request.args.get('need')
    goal_ids_str = request.args.get('goal')
    weather_ids_str = request.args.get('weather')
    max_kcal_str = request.args.get('max_kcal')
    max_price_str = request.args.get('max_price')

    # 2. 칼로리/가격 필터 조건과 파라미터 생성
    where_clauses = ["1=1"]
    params_where = []
    if max_kcal_str and int(max_kcal_str) < 2000:
        where_clauses.append("m.kcal <= %s")
        params_where.append(int(max_kcal_str))
    if max_price_str and int(max_price_str) < 50000:
        where_clauses.append("m.Price <= %s")
        params_where.append(int(max_price_str))

    # 3. 체크박스 점수 계산을 위한 조건과 파라미터 생성
    sub_queries = []
    params_score = []
    
    categories = category_str.split(',') if category_str else []
    if categories:
        placeholders = ','.join(['%s'] * len(categories))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM Menu WHERE Category IN ({placeholders})")
        params_score.extend(categories)
        
    need_ids = need_ids_str.split(',') if need_ids_str else []
    if need_ids:
        placeholders = ','.join(['%s'] * len(need_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuNeed WHERE NeedID IN ({placeholders})")
        params_score.extend(need_ids)

    goal_ids = goal_ids_str.split(',') if goal_ids_str else []
    if goal_ids:
        placeholders = ','.join(['%s'] * len(goal_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuGoal WHERE GoalID IN ({placeholders})")
        params_score.extend(goal_ids)

    weather_ids = weather_ids_str.split(',') if weather_ids_str else []
    if weather_ids:
        placeholders = ','.join(['%s'] * len(weather_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuWeather WHERE WeatherID IN ({placeholders})")
        params_score.extend(weather_ids)

    # 4. 최종 쿼리 구성
    # 체크박스 선택 여부에 따라 다른 쿼리를 사용하도록 분기
    if not sub_queries:
        # Case 1: 체크박스 선택이 없을 경우 (모두 '상관없음')
        # 칼로리/가격 필터만 적용하여 랜덤으로 1개 추천
        query = f"""
            SELECT m.MenuID, m.MenuKor, m.Category, m.kcal, m.Price, m.imagePath
            FROM Menu m
            WHERE {" AND ".join(where_clauses)}
            ORDER BY RAND()
            LIMIT 1;
        """
        final_params = params_where
    else:
        # Case 2: 체크박스 선택이 있을 경우
        # 점수를 계산하여 가장 높은 점수의 메뉴를 추천
        union_query = " UNION ALL ".join(sub_queries)
        query = f"""
            SELECT
                m.MenuID, m.MenuKor, m.Category, m.kcal, m.Price, m.imagePath,
                COALESCE(ScoreTable.total_score, 0) as total_score
            FROM
                Menu m
            LEFT JOIN (
                SELECT MenuID, SUM(score) as total_score
                FROM ({union_query}) AS ScoreSubQuery
                GROUP BY MenuID
            ) AS ScoreTable ON m.MenuID = ScoreTable.MenuID
            WHERE
                {" AND ".join(where_clauses)}
            ORDER BY
                total_score DESC, RAND()
            LIMIT 1;
        """
        # 파라미터 순서: 점수 계산용 파라미터가 먼저, 필터용 파라미터가 나중
        final_params = params_score + params_where

    # 5. 쿼리 실행 (기존과 동일)
    conn = get_db_connection()
    if conn is None:
        return jsonify({'message': '데이터베이스에 연결할 수 없습니다.'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query, final_params)
        result = cursor.fetchall()
        return jsonify(result)
    except Error as e:
        print(f"메뉴 추천 쿼리 오류: {e}")
        return jsonify({'message': '추천 메뉴를 불러오는 중 오류가 발생했습니다.'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
