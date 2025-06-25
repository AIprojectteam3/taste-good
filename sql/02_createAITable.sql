use ai3;

-- ================================================================
-- ==================- AI 데이터 관련 정보 테이블 -==================
-- ================================================================

-- =====================- 유저 기분 정보 테이블 -=====================
CREATE TABLE Need (
    NeedID INT PRIMARY KEY,
    NeedKor VARCHAR(255) NOT NULL
);

-- =====================- 원하는 기분 정보 테이블 -=====================
CREATE TABLE Goal (
    GoalID INT PRIMARY KEY,
    GoalKor VARCHAR(255) NOT NULL
);

-- =====================- 날씨 정보 테이블 -=====================
CREATE TABLE Weather (
    WeatherID INT PRIMARY KEY,
    WeatherKor VARCHAR(255) NOT NULL
);

-- =====================- 계절 정보 테이블 -=====================
CREATE TABLE Season (
    SeasonID INT PRIMARY KEY,
    SeasonKor VARCHAR(255) NOT NULL
);

-- =====================- 알레르기 정보 테이블 -=====================
CREATE TABLE Allergen (
    AllergenID INT PRIMARY KEY,
    AllergenKor VARCHAR(255) NOT NULL
);

-- =====================- 시간 정보 테이블 -=====================
CREATE TABLE timecode (
    TimeID INT PRIMARY KEY,
    TimeKor VARCHAR(20) NOT NULL
);

-- =====================- 메뉴 정보 테이블 -=====================
CREATE TABLE Menu (
    MenuID INT PRIMARY KEY,
    MenuKor VARCHAR(255) NOT NULL,
    Category VARCHAR(50),
    kcal INT,
    Price INT,
    imagePath VARCHAR(255)
);

-- ================================================================
-- ====================- AI 데이터 연결 테이블 -====================
-- ================================================================

-- =====================- 메뉴 <-> 유저 기분 연결 테이블 -=====================
CREATE TABLE MenuNeed (
    MenuID INT,
    NeedID INT,
    PRIMARY KEY (MenuID, NeedID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (NeedID) REFERENCES Need(NeedID) ON DELETE CASCADE
);

-- =====================- 메뉴 <-> 원하는 기분 연결 테이블 -=====================
CREATE TABLE MenuGoal (
    MenuID INT,
    GoalID INT,
    PRIMARY KEY (MenuID, GoalID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (GoalID) REFERENCES Goal(GoalID) ON DELETE CASCADE
);

-- =====================- 메뉴 <-> 날씨 연결 테이블 -=====================
CREATE TABLE MenuWeather (
    MenuID INT,
    WeatherID INT,
    PRIMARY KEY (MenuID, WeatherID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (WeatherID) REFERENCES Weather(WeatherID) ON DELETE CASCADE
);

-- =====================- 메뉴 <-> 계절 연결 테이블 -=====================
CREATE TABLE MenuSeason (
    MenuID INT,
    SeasonID INT,
    PRIMARY KEY (MenuID, SeasonID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (SeasonID) REFERENCES Season(SeasonID) ON DELETE CASCADE
);

-- =====================- 메뉴 <-> 알레르기 연결 테이블 -=====================
CREATE TABLE MenuAllergen (
    MenuID INT,
    AllergenID INT,
    PRIMARY KEY (MenuID, AllergenID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (AllergenID) REFERENCES Allergen(AllergenID) ON DELETE CASCADE
);

-- =====================- 메뉴 <-> 시간 연결 테이블 -=====================
CREATE TABLE menutime (
    MenuID INT,
    TimeID INT,
    PRIMARY KEY (MenuID, TimeID),
    FOREIGN KEY (MenuID) REFERENCES Menu(MenuID) ON DELETE CASCADE,
    FOREIGN KEY (TimeID) REFERENCES timecode(TimeID) ON DELETE CASCADE
);