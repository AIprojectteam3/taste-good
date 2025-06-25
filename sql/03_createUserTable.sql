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