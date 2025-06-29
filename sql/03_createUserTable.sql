use ai3;

-- =====================- 유저 -=====================
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    sns_id VARCHAR(255) NULL,
    provider VARCHAR(20) NOT NULL DEFAULT 'local', -- 가입 방식(local, kakao, naver) 구분
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    address VARCHAR(255) NULL,
    detail_address VARCHAR(255) NULL,
    profile_image_path VARCHAR(255) NULL,
    profile_intro TEXT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email (email)
);

-- =====================- 유저 레벨 -=====================
CREATE TABLE user_levels (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    level INT NULL DEFAULT 1,
    experience INT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    UNIQUE KEY uk_user_level (user_id),
    CONSTRAINT fk_user_levels_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================- 유저 포인트 -=====================
CREATE TABLE user_points (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    point INT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    UNIQUE KEY uk_user_point (user_id),
    CONSTRAINT fk_user_points_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================- 유저 로그인 기록 -=====================
CREATE TABLE user_logins (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    login_time TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    device_info VARCHAR(255) NULL,
    login_status ENUM('success','failure') NULL DEFAULT 'success',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_login_time (login_time),
    CONSTRAINT fk_user_logins_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================- 유저 <-> 알레르기 연결 테이블 -=====================
CREATE TABLE user_allergen (
    user_id      INT NOT NULL,
    allergen_id  INT NOT NULL,
    PRIMARY KEY (user_id, allergen_id),
    CONSTRAINT fk_user_allergen_user
        FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_allergen_allergen
        FOREIGN KEY (allergen_id)
        REFERENCES Allergen(AllergenID) ON DELETE CASCADE
);

-- =====================- 포인트 로그 -=====================
CREATE TABLE point_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    post_id INT NULL,
    comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_action_type (action_type)
);

-- =====================- 레벨 요구사항 -=====================
CREATE TABLE level_requirements (
    level INT NOT NULL,
    required_exp INT NOT NULL,
    icon_url VARCHAR(255) NULL,
    PRIMARY KEY (level),
    KEY idx_required_exp (required_exp)
);

-- =====================- 경험치 로그 -=====================
CREATE TABLE experience_logs (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    experience INT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    post_id INT NULL,
    comment_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_action_type (action_type),
    KEY idx_created_at (created_at),
    CONSTRAINT fk_exp_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================- 다마고치 -=====================
CREATE TABLE user_tamagotchi (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    pet_type_id INT NULL COMMENT '선택한 펫 타입 ID',
    pet_name VARCHAR(50) DEFAULT '내 다마고치',
    hunger INT DEFAULT 0 COMMENT '배고픔 (0-100)',
    health INT DEFAULT 0 COMMENT '건강도 (0-100)',
    happiness INT DEFAULT 0 COMMENT '행복도 (0-100)',
    is_completed BOOLEAN DEFAULT FALSE COMMENT '펫 완성 여부',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_tamagotchi_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_tamagotchi_pet_type 
        FOREIGN KEY (pet_type_id) REFERENCES pet_types(id) ON DELETE SET NULL,
    INDEX idx_pet_type_id (pet_type_id),
    INDEX idx_user_completed (user_id, is_completed)
);

-- =====================- 다마고치 펫 -=====================
CREATE TABLE pet_types (
    id int NOT NULL AUTO_INCREMENT,
    pet_name varchar(50) NOT NULL,
    pet_image_path varchar(255) NOT NULL,
    hunger_max_requirement int NOT NULL DEFAULT 100,
    health_max_requirement int NOT NULL DEFAULT 100,
    happiness_max_requirement int NOT NULL DEFAULT 100,
    completion_exp_reward int NOT NULL DEFAULT 100,
    pet_description text,
    unlock_level int DEFAULT 1,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_unlock_level (unlock_level)
);