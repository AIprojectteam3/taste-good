use ai3;

-- 기존 트리거가 있다면 삭제
DROP TRIGGER IF EXISTS after_user_insert_levels;
DROP TRIGGER IF EXISTS after_user_insert_points;

-- =====================- 유저 가입 시 레벨 기본 값 자동 입력 -=====================
DELIMITER $$
CREATE TRIGGER after_user_insert_levels
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_levels (user_id)
    VALUES (NEW.id);
END$$
DELIMITER ;

-- =====================- 유저 가입 시 포인트 기본 값 자동 입력 -=====================
DELIMITER $$
CREATE TRIGGER after_user_insert_points
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_points (user_id)
    VALUES (NEW.id);
END$$
DELIMITER ;

-- 트리거 생성 완료 메시지
SELECT 'User registration triggers created successfully!' AS message;

-- =====================- 필요 경험치 도달했을 경우 레벨 자동 상승(프로시저) -=====================
DELIMITER $$

CREATE PROCEDURE add_experience(
    IN p_user_id INT,
    IN p_exp_amount INT
)
BEGIN
    DECLARE current_level INT DEFAULT 1;
    DECLARE new_experience INT DEFAULT 0;
    
    UPDATE user_levels 
    SET experience = experience + p_exp_amount 
    WHERE user_id = p_user_id;
    
    SELECT experience INTO new_experience 
    FROM user_levels 
    WHERE user_id = p_user_id;
    
    SELECT MAX(level) INTO current_level
    FROM level_requirements 
    WHERE required_exp <= new_experience;
    
    UPDATE user_levels 
    SET level = current_level 
    WHERE user_id = p_user_id;
END$$

DELIMITER ;