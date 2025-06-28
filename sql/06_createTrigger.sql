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

DROP PROCEDURE IF EXISTS add_experience$$

CREATE PROCEDURE add_experience(
    IN p_user_id INT,
    IN p_exp_amount INT
)
BEGIN
    DECLARE cur_level INT DEFAULT 1;
    DECLARE cur_exp INT DEFAULT 0;
    DECLARE req_exp INT DEFAULT 100;
    DECLARE user_exists INT DEFAULT 0;
    
    -- Check if user exists in user_levels table
    SELECT COUNT(*) INTO user_exists
    FROM user_levels 
    WHERE user_id = p_user_id;
    
    IF user_exists = 0 THEN
        -- Insert new user with default values
        INSERT INTO user_levels (user_id, level, experience) 
        VALUES (p_user_id, 1, 0);
    END IF;
    
    -- Get current level and experience
    SELECT level, experience 
    INTO cur_level, cur_exp
    FROM user_levels 
    WHERE user_id = p_user_id;
    
    -- Add experience
    SET cur_exp = cur_exp + p_exp_amount;
    
    -- Level up check loop
    level_check: LOOP
        SELECT required_exp INTO req_exp
        FROM level_requirements 
        WHERE level = cur_level
        LIMIT 1;
        
        IF cur_exp >= req_exp THEN
            SET cur_exp = cur_exp - req_exp;
            SET cur_level = cur_level + 1;
            
            -- Check if next level exists
            IF NOT EXISTS(SELECT 1 FROM level_requirements WHERE level = cur_level) THEN
                SET cur_exp = req_exp;
                SET cur_level = cur_level - 1;
                LEAVE level_check;
            END IF;
        ELSE
            LEAVE level_check;
        END IF;
    END LOOP;
    
    -- Update existing record only
    UPDATE user_levels 
    SET level = cur_level, experience = cur_exp
    WHERE user_id = p_user_id;
        
END$$

DELIMITER ;