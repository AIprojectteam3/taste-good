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
    query = "SELECT DISTINCT Category FROM Menu WHERE Category IS NOT NULL AND Category != '' ORDER BY Category desc"
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

@app.route('/api/options/times', methods=['GET'])
def get_times():
    query = "SELECT TimeID, TimeKor FROM timecode ORDER BY TimeID"
    return get_options(query)

# === 추천 로직 수정 ===
@app.route('/api/recommend', methods=['GET'])
def recommend_menu():
    # 파라미터 수신
    category_str = request.args.get('category')
    need_ids_str = request.args.get('need')
    goal_ids_str = request.args.get('goal')
    weather_ids_str = request.args.get('weather')
    time_ids_str = request.args.get('time')  # 시간대 파라미터
    max_kcal_str = request.args.get('max_kcal')
    max_price_str = request.args.get('max_price')

    # WHERE 조건 (필수 필터링)
    where_clauses = ["1=1"]
    params_where = []

    # 칼로리/가격 필터
    if max_kcal_str and int(max_kcal_str) < 2000:
        where_clauses.append("m.kcal <= %s")
        params_where.append(int(max_kcal_str))

    if max_price_str and int(max_price_str) < 50000:
        where_clauses.append("m.Price <= %s")
        params_where.append(int(max_price_str))

    # 시간대 필터 (필수 조건으로 추가)
    time_ids = time_ids_str.split(',') if time_ids_str else []
    if time_ids and 'all' not in time_ids:
        where_clauses.append("m.MenuID IN (SELECT MenuID FROM MenuTime WHERE TimeID IN (" + ','.join(['%s'] * len(time_ids)) + "))")
        params_where.extend(time_ids)

    # 점수 계산용 서브쿼리
    sub_queries = []
    params_score = []

    # 카테고리 점수
    categories = category_str.split(',') if category_str else []
    if categories and 'all' not in categories:
        placeholders = ','.join(['%s'] * len(categories))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM Menu WHERE Category IN ({placeholders})")
        params_score.extend(categories)

    # 상황 점수
    need_ids = need_ids_str.split(',') if need_ids_str else []
    if need_ids and 'all' not in need_ids:
        placeholders = ','.join(['%s'] * len(need_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuNeed WHERE NeedID IN ({placeholders})")
        params_score.extend(need_ids)

    # 목표 점수
    goal_ids = goal_ids_str.split(',') if goal_ids_str else []
    if goal_ids and 'all' not in goal_ids:
        placeholders = ','.join(['%s'] * len(goal_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuGoal WHERE GoalID IN ({placeholders})")
        params_score.extend(goal_ids)

    # 날씨 점수
    weather_ids = weather_ids_str.split(',') if weather_ids_str else []
    if weather_ids and 'all' not in weather_ids:
        placeholders = ','.join(['%s'] * len(weather_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuWeather WHERE WeatherID IN ({placeholders})")
        params_score.extend(weather_ids)

    
    if time_ids and 'all' not in time_ids:
        placeholders = ','.join(['%s'] * len(time_ids))
        sub_queries.append(f"SELECT MenuID, 1 as score FROM MenuTime WHERE TimeID IN ({placeholders})")
        params_score.extend(time_ids)

    # 최종 쿼리 구성
    if not sub_queries:
        # 체크박스 선택이 없을 경우
        query = f"""
        SELECT m.MenuID, m.MenuKor, m.Category, m.kcal, m.Price, m.imagePath
        FROM Menu m
        WHERE {" AND ".join(where_clauses)}
        ORDER BY RAND()
        LIMIT 1;
        """
        final_params = params_where
    else:
        # 체크박스 선택이 있을 경우
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
        final_params = params_score + params_where

    # 쿼리 실행
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
