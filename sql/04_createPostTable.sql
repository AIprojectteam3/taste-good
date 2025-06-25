use ai3;

-- =====================- 게시물 -=====================
CREATE TABLE posts (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    views INT NULL DEFAULT 0,
    likes INT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_posts_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================- 댓글 -=====================
CREATE TABLE comments (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_post_id (post_id),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_comments_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================- 게시물 이미지 -=====================
CREATE TABLE files (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    file_name VARCHAR(100) NOT NULL,
    file_path VARCHAR(200) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_post_id (post_id),
    CONSTRAINT fk_files_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- =====================- 좋아요 -=====================
CREATE TABLE post_likes (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    liked_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_post_id (post_id),
    KEY idx_user_id (user_id),
    UNIQUE KEY uk_post_user (post_id, user_id),
    CONSTRAINT fk_post_likes_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id)
);

-- =====================- 조회수 -=====================
CREATE TABLE post_views (
    id INT NOT NULL AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    viewed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_post_id (post_id),
    KEY idx_user_id (user_id),
    CONSTRAINT fk_post_views_post_id 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_views_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_post_user_view (post_id, user_id, DATE(viewed_at))
);

-- =====================- 검색기록 -=====================
CREATE TABLE search_logs (
    id INT NOT NULL AUTO_INCREMENT,
    user_id INT NULL,
    search_term VARCHAR(255) NOT NULL,
    search_type VARCHAR(50) NULL DEFAULT 'all',
    result_count INT NULL DEFAULT 0,
    clicked_post_id INT NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_search_term (search_term(250)),
    KEY idx_created_at (created_at),
    CONSTRAINT fk_search_logs_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id)
);