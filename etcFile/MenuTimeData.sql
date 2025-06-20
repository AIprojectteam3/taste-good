-- 시간대 코드 데이터 삽입
INSERT INTO timecode (TimeID, TimeKor) VALUES
(1, '아침'),
(2, '점심'),
(3, '저녁'),
(4, '야식'),
(5, '간식(티타임)');

-- 메뉴 <-> 시간대 매핑 데이터 삽입(csv 파일 필요)
LOAD DATA LOCAL INFILE 'C:/ksc/git/taste-good/etcFile/output_mealtime.csv'   -- CSV로 저장한 파일
INTO TABLE menutime
FIELDS TERMINATED BY ','        -- 쉼표 구분
LINES  TERMINATED BY '\n'       -- 줄바꿈
IGNORE 1 LINES                  -- 헤더(MenuID,MealTimeID) 무시
(MenuID, TimeID);