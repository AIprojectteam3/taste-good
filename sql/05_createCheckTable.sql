use ai3;

-- 출석체크 로그 테이블
CREATE TABLE attendance_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    points_earned INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, attendance_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, attendance_date),
    INDEX idx_attendance_date (attendance_date)
);

-- 출석체크용 질문 테이블
CREATE TABLE attendance_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    category_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES question_categories(id),
    INDEX idx_category_active (category_id, is_active)
);

-- 출석체크 답변 테이블
CREATE TABLE attendance_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_log_id INT NOT NULL,
    question_id INT NOT NULL,
    user_answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_log_id) REFERENCES attendance_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES attendance_questions(id),
    INDEX idx_attendance_log (attendance_log_id),
    INDEX idx_question (question_id)
);

-- 출석체크 보상 테이블
CREATE TABLE attendance_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consecutive_days INT NOT NULL UNIQUE,
    reward_points INT NOT NULL,
    reward_description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_consecutive_days (consecutive_days),
    INDEX idx_active (is_active)
);

-- 사용자 출석 통계 테이블
CREATE TABLE user_attendance_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_attendance_days INT DEFAULT 0,
    current_consecutive_days INT DEFAULT 0,
    max_consecutive_days INT DEFAULT 0,
    current_month_attendance INT DEFAULT 0,
    current_year_attendance INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    last_attendance_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_attendance (last_attendance_date)
);

-- 질문 카테고리 테이블
CREATE TABLE question_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT,
    icon_path VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active_sort (is_active, sort_order)
);

-- 질문 카테고리별 답변 코드 매핑 테이블
CREATE TABLE question_answer_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    answer_text VARCHAR(100) NOT NULL,
    answer_code INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES question_categories(id),
    INDEX idx_category_code (category_id, answer_code)
);

-- 질문별 객관식 선택지 테이블
CREATE TABLE question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(100) NOT NULL,
    option_value INT NOT NULL,
    option_emoji VARCHAR(10),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES attendance_questions(id) ON DELETE CASCADE,
    INDEX idx_question_sort (question_id, sort_order)
);
