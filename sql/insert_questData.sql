use ai3;

-- 데이터베이스 인코딩 변경
ALTER DATABASE taste_good CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- question_options 테이블 인코딩 변경
ALTER TABLE question_options CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- option_emoji 컬럼 인코딩 변경
ALTER TABLE question_options MODIFY option_emoji VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- question_categories 테이블에 카테고리 데이터 삽입
INSERT INTO question_categories (category_name, category_description, sort_order) VALUES
('맛 선호도', '맛 선호도 관련 질문 (단맛, 짠맛, 매운맛 등)', 1),
('음식 종류', '음식 카테고리 선호도 관련 질문', 2),
('기분/상황', '현재 기분이나 상황 관련 질문', 3),
('식습관/건강', '식습관 및 건강 관련 질문', 4),
('날씨/계절', '날씨/계절 관련 선호도 질문', 5),
('식사 상황', '식사 상황 관련 질문 (혼밥, 회식 등)', 6);

INSERT INTO attendance_questions (question_text, category_id) VALUES
('오늘은 어떤 맛이 당기시나요?', 1),
('지금 기분에는 어떤 맛의 강도가 좋을까요?', 1),
('평소 매운 음식을 어느 정도 드시나요?', 1),
('단맛과 짠맛 중 지금 더 끌리는 것은?', 1),
('깔끔한 맛 vs 진한 맛, 오늘은 어떤 기분인가요?', 1),
('신맛이나 새콤한 음식은 어떠세요?', 1),
('쓴맛(커피, 쌈채소 등)에 대한 선호도는?', 1),
('오늘은 담백한 맛 vs 자극적인 맛?', 1);

-- 질문 1: "오늘은 어떤 맛이 당기시나요?" (question_id = 1)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(1, '단맛', 1, '🍯', 1),
(1, '짠맛', 2, '🧂', 2),
(1, '매운맛', 3, '🌶️', 3),
(1, '신맛', 4, '🍋', 4),
(1, '쓴맛', 5, '☕', 5);

-- 질문 2: "지금 기분에는 어떤 맛의 강도가 좋을까요?" (question_id = 2)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(2, '가벼운 맛', 6, '💧', 1),
(2, '보통 맛', 7, '🍽️', 2),
(2, '진한 맛', 8, '🍖', 3),
(2, '자극적인 맛', 3, '🌶️', 4);

-- 질문 3: "평소 매운 음식을 어느 정도 드시나요?" (question_id = 3)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(3, '전혀 안 먹어요', 9, '❌', 1),
(3, '조금만 매운 것', 10, '🌶️', 2),
(3, '보통 매운 것', 3, '🌶️🌶️', 3),
(3, '많이 매운 것', 11, '🌶️🌶️🌶️', 4),
(3, '아주 매운 것', 12, '🔥', 5);

-- 질문 4: "단맛과 짠맛 중 지금 더 끌리는 것은?" (question_id = 4)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(4, '단맛', 1, '🍯', 1),
(4, '짠맛', 2, '🧂', 2),
(4, '둘 다 좋아요', 13, '😋', 3);

-- 질문 5: "깔끔한 맛 vs 진한 맛, 오늘은 어떤 기분인가요?" (question_id = 5)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(5, '깔끔한 맛', 6, '💧', 1),
(5, '진한 맛', 8, '🍖', 2),
(5, '적당한 맛', 7, '⚖️', 3);

-- 질문 6: "신맛이나 새콤한 음식은 어떠세요?" (question_id = 6)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(6, '좋아해요', 14, '😍', 1),
(6, '보통이에요', 15, '😐', 2),
(6, '별로예요', 16, '😕', 3),
(6, '싫어해요', 17, '😖', 4);

-- 질문 7: "쓴맛(커피, 쌈채소 등)에 대한 선호도는?" (question_id = 7)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(7, '좋아해요', 18, '☕', 1),
(7, '괜찮아요', 19, '👍', 2),
(7, '별로예요', 20, '👎', 3),
(7, '못 먹어요', 21, '🚫', 4);

-- 질문 8: "오늘은 담백한 맛 vs 자극적인 맛?" (question_id = 8)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(8, '담백한 맛', 22, '🥬', 1),
(8, '자극적인 맛', 23, '🌶️', 2),
(8, '중간 정도', 24, '⚖️', 3);


INSERT INTO attendance_questions (question_text, category_id) VALUES
('오늘은 어떤 종류의 음식이 생각나시나요?', 2),
('한식, 중식, 일식, 양식 중 지금 가장 끌리는 것은?', 2),
('면요리 vs 밥요리, 지금 어떤 것이 더 당기시나요?', 2),
('국물 있는 음식 vs 국물 없는 음식?', 2),
('오늘은 고기 vs 해산물 vs 채소 중 어떤 기분인가요?', 2),
('분식(떡볶이, 김밥 등)은 어떠세요?', 2),
('디저트나 달콤한 음식이 당기시나요?', 2),
('든든한 식사 vs 가벼운 식사?', 2);

-- 질문 9: "오늘은 어떤 종류의 음식이 생각나시나요?" (question_id = 9)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(9, '한식', 1, '🍚', 1),
(9, '중식', 2, '🥟', 2),
(9, '일식', 3, '🍣', 3),
(9, '양식', 4, '🍝', 4),
(9, '분식', 5, '🍢', 5),
(9, '기타 아시아 음식', 25, '🍜', 6);

-- 질문 10: "한식, 중식, 일식, 양식 중 지금 가장 끌리는 것은?" (question_id = 10)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(10, '한식', 1, '🍚', 1),
(10, '중식', 2, '🥟', 2),
(10, '일식', 3, '🍣', 3),
(10, '양식', 4, '🍝', 4);

-- 질문 11: "면요리 vs 밥요리, 지금 어떤 것이 더 당기시나요?" (question_id = 11)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(11, '면요리', 6, '🍜', 1),
(11, '밥요리', 7, '🍛', 2),
(11, '둘 다 좋아요', 26, '😋', 3);

-- 질문 12: "국물 있는 음식 vs 국물 없는 음식?" (question_id = 12)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(12, '국물 있는 음식', 8, '🍲', 1),
(12, '국물 없는 음식', 9, '🍖', 2),
(12, '상관없어요', 27, '🤷', 3);

-- 질문 13: "오늘은 고기 vs 해산물 vs 채소 중 어떤 기분인가요?" (question_id = 13)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(13, '고기', 28, '🥩', 1),
(13, '해산물', 29, '🦐', 2),
(13, '채소', 30, '🥬', 3),
(13, '다 좋아요', 31, '🍽️', 4);

-- 질문 14: "분식(떡볶이, 김밥 등)은 어떠세요?" (question_id = 14)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(14, '좋아해요', 32, '😍', 1),
(14, '괜찮아요', 33, '👍', 2),
(14, '별로예요', 34, '👎', 3),
(14, '안 먹어요', 35, '🚫', 4);

-- 질문 15: "디저트나 달콤한 음식이 당기시나요?" (question_id = 15)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(15, '많이 당겨요', 36, '🤤', 1),
(15, '조금 당겨요', 37, '😊', 2),
(15, '별로 안 당겨요', 38, '😐', 3),
(15, '전혀 안 당겨요', 39, '😑', 4);

-- 질문 16: "든든한 식사 vs 가벼운 식사?" (question_id = 16)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(16, '든든한 식사', 40, '🍖', 1),
(16, '가벼운 식사', 41, '🥗', 2),
(16, '적당한 식사', 42, '⚖️', 3);


INSERT INTO attendance_questions (question_text, category_id) VALUES
('지금 기분을 한 단어로 표현한다면?', 3),
('오늘 하루는 어떠셨나요?', 3),
('지금 가장 필요한 것은 무엇인가요?', 3),
('오늘 특별한 일이나 기념일이 있으신가요?', 3),
('지금 에너지 레벨은 어느 정도인가요?', 3),
('스트레스 해소가 필요한 상황인가요?', 3),
('기분 전환이 필요하신가요?', 3),
('편안함 vs 자극적인 것 중 뭐가 필요하세요?', 3);

-- 질문 17: "지금 기분을 한 단어로 표현한다면?" (question_id = 17)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(17, '행복', 1, '😊', 1),
(17, '우울', 2, '😔', 2),
(17, '스트레스', 3, '😤', 3),
(17, '피곤', 4, '😴', 4),
(17, '활기찬', 5, '⚡', 5),
(17, '차분한', 6, '😌', 6),
(17, '분노', 7, '😠', 7),
(17, '심심', 8, '😑', 8);

-- 질문 18: "오늘 하루는 어떠셨나요?" (question_id = 18)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(18, '아주 좋았어요', 43, '😄', 1),
(18, '좋았어요', 44, '😊', 2),
(18, '보통이에요', 45, '😐', 3),
(18, '힘들었어요', 46, '😞', 4),
(18, '매우 힘들었어요', 47, '😭', 5);

-- 질문 19: "지금 가장 필요한 것은 무엇인가요?" (question_id = 19)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(19, '휴식', 48, '😴', 1),
(19, '에너지', 49, '⚡', 2),
(19, '위로', 50, '🤗', 3),
(19, '즐거움', 51, '🎉', 4),
(19, '집중력', 52, '🎯', 5),
(19, '평온함', 53, '🕊️', 6);

-- 질문 20: "오늘 특별한 일이나 기념일이 있으신가요?" (question_id = 20)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(20, '생일', 54, '🎂', 1),
(20, '기념일', 55, '💕', 2),
(20, '축하할 일', 56, '🎉', 3),
(20, '중요한 약속', 57, '📅', 4),
(20, '특별한 일 없음', 58, '📅', 5);

-- 질문 21: "지금 에너지 레벨은 어느 정도인가요?" (question_id = 21)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(21, '매우 높음', 59, '🔥', 1),
(21, '높음', 60, '⚡', 2),
(21, '보통', 61, '😐', 3),
(21, '낮음', 62, '😴', 4),
(21, '매우 낮음', 63, '🪫', 5);

-- 질문 22: "스트레스 해소가 필요한 상황인가요?" (question_id = 22)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(22, '매우 필요해요', 64, '😰', 1),
(22, '조금 필요해요', 65, '😅', 2),
(22, '보통이에요', 66, '😐', 3),
(22, '별로 필요없어요', 67, '😊', 4),
(22, '전혀 필요없어요', 68, '😄', 5);

-- 질문 23: "기분 전환이 필요하신가요?" (question_id = 23)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(23, '매우 필요해요', 69, '🔄', 1),
(23, '조금 필요해요', 70, '🌟', 2),
(23, '보통이에요', 71, '😐', 3),
(23, '별로 필요없어요', 72, '😊', 4);

-- 질문 24: "편안함 vs 자극적인 것 중 뭐가 필요하세요?" (question_id = 24)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(24, '편안함', 73, '😌', 1),
(24, '자극적인 것', 74, '🌶️', 2),
(24, '둘 다 좋아요', 75, '⚖️', 3),
(24, '잘 모르겠어요', 76, '🤔', 4);


INSERT INTO attendance_questions (question_text, category_id) VALUES
('최근 건강 관리에 신경 쓰고 계신가요?', 4),
('오늘 칼로리를 조절하고 싶으신가요?', 4),
('소화가 잘 되는 음식을 선호하시나요?', 4),
('영양 균형을 생각해서 먹고 싶으신가요?', 4),
('다이어트 중이신가요?', 4),
('단백질이 많은 음식이 필요하신가요?', 4),
('비타민이 풍부한 음식을 원하시나요?', 4),
('포만감 vs 가벼움 중 어떤 것을 원하세요?', 4);

-- 질문 25: "최근 건강 관리에 신경 쓰고 계신가요?" (question_id = 25)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(25, '매우 신경 써요', 77, '💪', 1),
(25, '조금 신경 써요', 78, '👍', 2),
(25, '보통이에요', 79, '😐', 3),
(25, '별로 안 써요', 80, '🤷', 4),
(25, '전혀 안 써요', 81, '😅', 5);

-- 질문 26: "오늘 칼로리를 조절하고 싶으신가요?" (question_id = 26)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(26, '매우 조절하고 싶어요', 82, '📉', 1),
(26, '조금 조절하고 싶어요', 83, '⚖️', 2),
(26, '상관없어요', 84, '😐', 3),
(26, '칼로리 많이 섭취하고 싶어요', 85, '🍔', 4);

-- 질문 27: "소화가 잘 되는 음식을 선호하시나요?" (question_id = 27)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(27, '매우 선호해요', 86, '😌', 1),
(27, '선호해요', 87, '👍', 2),
(27, '보통이에요', 88, '😐', 3),
(27, '별로 상관없어요', 89, '🤷', 4);

-- 질문 28: "영양 균형을 생각해서 먹고 싶으신가요?" (question_id = 28)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(28, '매우 중요해요', 90, '🥗', 1),
(28, '중요해요', 91, '🍎', 2),
(28, '보통이에요', 92, '😐', 3),
(28, '별로 중요하지 않아요', 93, '🍕', 4);

-- 질문 29: "다이어트 중이신가요?" (question_id = 29)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(29, '적극적으로 다이어트 중', 94, '🏃', 1),
(29, '가볍게 다이어트 중', 95, '🚶', 2),
(29, '다이어트 고민 중', 96, '🤔', 3),
(29, '다이어트 안 해요', 97, '😊', 4);

-- 질문 30: "단백질이 많은 음식이 필요하신가요?" (question_id = 30)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(30, '매우 필요해요', 98, '🥩', 1),
(30, '필요해요', 99, '🍗', 2),
(30, '보통이에요', 100, '😐', 3),
(30, '별로 필요없어요', 101, '🥬', 4);

-- 질문 31: "비타민이 풍부한 음식을 원하시나요?" (question_id = 31)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(31, '매우 원해요', 102, '🍊', 1),
(31, '원해요', 103, '🥕', 2),
(31, '보통이에요', 104, '😐', 3),
(31, '별로 상관없어요', 105, '🤷', 4);

-- 질문 32: "포만감 vs 가벼움 중 어떤 것을 원하세요?" (question_id = 32)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(32, '든든한 포만감', 106, '🍖', 1),
(32, '적당한 포만감', 107, '🍽️', 2),
(32, '가벼운 느낌', 108, '🥗', 3),
(32, '매우 가벼운 느낌', 109, '🍃', 4);


INSERT INTO attendance_questions (question_text, category_id) VALUES
('오늘 날씨에 어울리는 음식은 뭐라고 생각하세요?', 5),
('더운 날씨에는 시원한 음식, 추운 날씨에는 따뜻한 음식을 선호하시나요?', 5),
('지금 계절에 가장 먹고 싶은 음식은?', 5),
('비 오는 날에는 어떤 음식이 생각나시나요?', 5),
('여름철 시원한 음식 vs 겨울철 따뜻한 음식?', 5),
('봄에 어울리는 상큼한 음식은 어떠세요?', 5),
('가을에 어울리는 든든한 음식이 당기시나요?', 5),
('날씨가 음식 선택에 영향을 주나요?', 5);

-- 질문 33: "오늘 날씨에 어울리는 음식은 뭐라고 생각하세요?" (question_id = 33)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(33, '시원한 음식', 110, '🧊', 1),
(33, '따뜻한 음식', 111, '🔥', 2),
(33, '실온 음식', 112, '🌡️', 3),
(33, '날씨 상관없어요', 113, '🤷', 4);

-- 질문 34: "더운 날씨에는 시원한 음식, 추운 날씨에는 따뜻한 음식을 선호하시나요?" (question_id = 34)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(34, '매우 그래요', 114, '👍', 1),
(34, '그런 편이에요', 115, '😊', 2),
(34, '보통이에요', 116, '😐', 3),
(34, '별로 그렇지 않아요', 117, '🤔', 4),
(34, '전혀 그렇지 않아요', 118, '🙅', 5);

-- 질문 35: "지금 계절에 가장 먹고 싶은 음식은?" (question_id = 35)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(35, '봄 - 상큼한 음식', 119, '🌸', 1),
(35, '여름 - 시원한 음식', 120, '☀️', 2),
(35, '가을 - 든든한 음식', 121, '🍂', 3),
(35, '겨울 - 따뜻한 음식', 122, '❄️', 4),
(35, '계절 상관없어요', 123, '🌍', 5);

-- 질문 36: "비 오는 날에는 어떤 음식이 생각나시나요?" (question_id = 36)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(36, '따뜻한 국물 요리', 124, '🍲', 1),
(36, '전/부침개', 125, '🥞', 2),
(36, '라면', 126, '🍜', 3),
(36, '치킨', 127, '🍗', 4),
(36, '특별히 없어요', 128, '🤷', 5);

-- 질문 37: "여름철 시원한 음식 vs 겨울철 따뜻한 음식?" (question_id = 37)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(37, '여름철 시원한 음식', 129, '🧊', 1),
(37, '겨울철 따뜻한 음식', 130, '🔥', 2),
(37, '둘 다 좋아요', 131, '😋', 3),
(37, '계절 상관없어요', 132, '🌍', 4);

-- 질문 38: "봄에 어울리는 상큼한 음식은 어떠세요?" (question_id = 38)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(38, '매우 좋아해요', 133, '🤩', 1),
(38, '좋아해요', 134, '😊', 2),
(38, '보통이에요', 135, '😐', 3),
(38, '별로예요', 136, '😕', 4),
(38, '안 좋아해요', 137, '😖', 5);

-- 질문 39: "가을에 어울리는 든든한 음식이 당기시나요?" (question_id = 39)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(39, '매우 당겨요', 138, '🤤', 1),
(39, '당겨요', 139, '😋', 2),
(39, '보통이에요', 140, '😐', 3),
(39, '별로 안 당겨요', 141, '😑', 4),
(39, '전혀 안 당겨요', 142, '🙅', 5);

-- 질문 40: "날씨가 음식 선택에 영향을 주나요?" (question_id = 40)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(40, '매우 많이 줘요', 143, '🌡️', 1),
(40, '어느 정도 줘요', 144, '👍', 2),
(40, '보통이에요', 145, '😐', 3),
(40, '별로 안 줘요', 146, '🤷', 4),
(40, '전혀 안 줘요', 147, '🚫', 5);


INSERT INTO attendance_questions (question_text, category_id) VALUES
('오늘 누구와 함께 식사하실 예정인가요?', 6),
('혼자 먹기 좋은 음식 vs 함께 나눠 먹기 좋은 음식?', 6),
('집에서 vs 밖에서, 어디서 드시고 싶으신가요?', 6),
('간단히 vs 정성스럽게, 어떤 식사를 원하시나요?', 6),
('회식이나 모임 음식으로 좋은 것은?', 6),
('데이트 음식으로 어떤 것이 좋을까요?', 6),
('가족과 함께 먹기 좋은 음식은?', 6),
('혼밥할 때 선호하는 음식 스타일은?', 6);

-- 질문 41: "오늘 누구와 함께 식사하실 예정인가요?" (question_id = 41)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(41, '혼자', 1, '😊', 1),
(41, '가족', 2, '👨‍👩‍👧‍👦', 2),
(41, '친구', 3, '👫', 3),
(41, '연인', 4, '💕', 4),
(41, '동료', 5, '👥', 5),
(41, '아직 정하지 않음', 6, '🤔', 6);

-- 질문 42: "혼자 먹기 좋은 음식 vs 함께 나눠 먹기 좋은 음식?" (question_id = 42)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(42, '혼자 먹기 좋은 음식', 148, '🍜', 1),
(42, '함께 나눠 먹기 좋은 음식', 149, '🍲', 2),
(42, '둘 다 좋아요', 150, '😋', 3);

-- 질문 43: "집에서 vs 밖에서, 어디서 드시고 싶으신가요?" (question_id = 43)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(43, '집에서', 151, '🏠', 1),
(43, '밖에서', 152, '🏪', 2),
(43, '배달/포장', 153, '🛵', 3),
(43, '상관없어요', 154, '🤷', 4);

-- 질문 44: "간단히 vs 정성스럽게, 어떤 식사를 원하시나요?" (question_id = 44)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(44, '간단한 식사', 155, '⚡', 1),
(44, '정성스러운 식사', 156, '👨‍🍳', 2),
(44, '적당한 수준', 157, '⚖️', 3);

-- 질문 45: "회식이나 모임 음식으로 좋은 것은?" (question_id = 45)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(45, '고기류', 158, '🥩', 1),
(45, '치킨', 159, '🍗', 2),
(45, '해산물', 160, '🦐', 3),
(45, '한식', 161, '🍚', 4),
(45, '중식', 162, '🥟', 5),
(45, '피자/파스타', 163, '🍕', 6);

-- 질문 46: "데이트 음식으로 어떤 것이 좋을까요?" (question_id = 46)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(46, '로맨틱한 레스토랑', 164, '🌹', 1),
(46, '캐주얼한 카페', 165, '☕', 2),
(46, '이색적인 음식', 166, '🍱', 3),
(46, '달콤한 디저트', 167, '🧁', 4),
(46, '분위기 좋은 곳', 168, '🕯️', 5);

-- 질문 47: "가족과 함께 먹기 좋은 음식은?" (question_id = 47)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(47, '한식 정식', 169, '🍚', 1),
(47, '찌개류', 170, '🍲', 2),
(47, '구이류', 171, '🥩', 3),
(47, '면요리', 172, '🍜', 4),
(47, '전골', 173, '🥘', 5),
(47, '집밥 스타일', 174, '🏠', 6);

-- 질문 48: "혼밥할 때 선호하는 음식 스타일은?" (question_id = 48)
INSERT INTO question_options (question_id, option_text, option_value, option_emoji, sort_order) VALUES
(48, '간편한 한 그릇 요리', 175, '🍜', 1),
(48, '든든한 정식', 176, '🍱', 2),
(48, '가벼운 샐러드', 177, '🥗', 3),
(48, '배달음식', 178, '🛵', 4),
(48, '인스턴트 음식', 179, '🍝', 5),
(48, '직접 요리', 180, '👨‍🍳', 6);
