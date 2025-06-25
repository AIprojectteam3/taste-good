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