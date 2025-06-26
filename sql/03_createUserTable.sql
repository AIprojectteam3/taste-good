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
    pet_name VARCHAR(50) DEFAULT '내 다마고치',
    hunger INT DEFAULT 70 COMMENT '배고픔 (0-100)',
    health INT DEFAULT 85 COMMENT '건강도 (0-100)',
    happiness INT DEFAULT 60 COMMENT '행복도 (0-100)',
    last_fed TIMESTAMP NULL COMMENT '마지막 먹이 준 시간',
    last_cared TIMESTAMP NULL COMMENT '마지막 돌본 시간',
    last_played TIMESTAMP NULL COMMENT '마지막 놀아준 시간',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_user_tamagotchi (user_id),
    CONSTRAINT fk_user_tamagotchi_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================- 다마고치 펫 -=====================
CREATE TABLE pet_types (
    id INT NOT NULL AUTO_INCREMENT,
    pet_name VARCHAR(50) NOT NULL COMMENT '펫 이름',
    pet_image_path VARCHAR(255) NOT NULL COMMENT '펫 이미지 경로',
    hunger_max_requirement INT NOT NULL DEFAULT 100 COMMENT '배고픔 스텟 최대 필요치',
    health_max_requirement INT NOT NULL DEFAULT 100 COMMENT '건강도 스텟 최대 필요치',
    happiness_max_requirement INT NOT NULL DEFAULT 100 COMMENT '행복도 스텟 최대 필요치',
    completion_exp_reward INT NOT NULL DEFAULT 100 COMMENT '모든 스텟 100% 달성 시 경험치 보상',
    pet_description TEXT NULL COMMENT '펫 설명',
    pet_rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common' COMMENT '펫 희귀도',
    unlock_level INT DEFAULT 1 COMMENT '펫 해금 필요 레벨',
    feeding_efficiency DECIMAL(3,2) DEFAULT 1.00 COMMENT '먹이주기 효율 (기본값 대비 배수)',
    care_efficiency DECIMAL(3,2) DEFAULT 1.00 COMMENT '돌보기 효율 (기본값 대비 배수)',
    play_efficiency DECIMAL(3,2) DEFAULT 1.00 COMMENT '놀아주기 효율 (기본값 대비 배수)',
    special_ability VARCHAR(100) NULL COMMENT '펫 특수 능력',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    sort_order INT DEFAULT 0 COMMENT '정렬 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_pet_rarity (pet_rarity),
    KEY idx_unlock_level (unlock_level),
    KEY idx_sort_order (sort_order)
);