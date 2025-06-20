use taste_good;

-- 시간대 코드 테이블 생성
CREATE TABLE timecode (
    TimeID  INT         PRIMARY KEY,
    TimeKor VARCHAR(20) NOT NULL
);

-- 메뉴 <-> 시간대 매핑 테이블 생성
CREATE TABLE menutime (
    MenuID INT NOT NULL,
    TimeID INT NOT NULL,
    PRIMARY KEY (MenuID, TimeID),
    CONSTRAINT fk_mmt_menu     FOREIGN KEY (MenuID) REFERENCES menu(MenuID) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_mmt_mealtime FOREIGN KEY (TimeID) REFERENCES meal_time(TimeID) ON UPDATE CASCADE ON DELETE CASCADE
);