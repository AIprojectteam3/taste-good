const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const session = require('express-session');
// ...existing code...
// const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
// ...existing code...
const app = express();
const PORT = 3000;
//89ad63367f00d39537ef72651c1dce55 rest api key
//0ad0234b4cdaf5ff61c8c89276f01dcf js key
const KAKAO_REST_API_KEY = '89ad63367f00d39537ef72651c1dce55';
const JWT_SECRET = 'YOUR_JWT_SECRET';
//4tm4ibvzRt4UK09un3v9 naver key
const NAVER_CLIENT_ID = '4tm4ibvzRt4UK09un3v9';
const NAVER_CLIENT_SECRET = 'aEIsjYJR1G';
const cors = require('cors');

const fs = require('fs');
const dotenv = require('dotenv');

// 1. 기존 환경변수 완전 삭제
delete process.env.OPENAI_API_KEY;

// 2. override 옵션으로 강제 로드
dotenv.config({ override: true });

// 3. 동적 재로드 함수 실행
const reloadEnv = () => {
    const envConfig = dotenv.parse(fs.readFileSync('.env'))
    for (const key in envConfig) {
        process.env[key] = envConfig[key]
    }
}
reloadEnv();

// 4. 확인
// console.log('최종 로드된 키:', process.env.OPENAI_API_KEY);

const { OpenAI } = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 폼 데이터 처리를 위해 추가

const corsOptions = {
    origin: 'http://localhost:3000', // 프론트엔드 주소
    optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'localhost',            // MySQL 서버 주소
    port: 3306,                   // MySQL 포트 번호
    user: 'root',                 // MySQL 사용자 이름
    password: '',                 // MySQL 비밀번호
    database: 'taste_good',       // 사용할 데이터베이스 이름
});

// MySQL 연결
db.connect((err) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
        return;
    }
    console.log('MySQL에 연결되었습니다.');
});

app.use(session({
    secret: 'aVeryL0ngAndRandomStringThatIsHardToGuess!@#$%^&*()', // 세션 암호화 키 (보안상 중요)
    resave: false,                      // 세션이 변경되지 않아도 다시 저장할지 여부
    saveUninitialized: true,            // 초기화되지 않은 세션을 저장소에 저장할지 여부
    cookie: {
        secure: false,                   // HTTPS 환경에서는 true로 설정
        maxAge: 1000 * 60 * 60 * 24     // 쿠키 유효 기간 (예: 1일)
    }
}));

// 기본 라우트: intro.html 반환
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'intro.html'));
});

app.use(express.static(path.join(__dirname))); // 정적 파일 제공

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// ===============================================================================================================================================
// 폴더 존재 확인 후 없을 경우 생성
// ===============================================================================================================================================
// 폴더 생성 함수
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`폴더 생성됨: ${dirPath}`);
    }
};

// 서버 시작 전에 필요한 폴더들 생성
ensureDirectoryExists('Uploads/Profile_Image/');
ensureDirectoryExists('Uploads/Post_Image/');
ensureDirectoryExists('uploads/default/');

// 유효성 검사 함수들
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { valid: false, message: '닉네임을 입력해주세요.' };
    }
    
    const trimmedUsername = username.trim();
    
    if (trimmedUsername.length < 2) {
        return { valid: false, message: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    
    if (trimmedUsername.length > 8) {
        return { valid: false, message: '닉네임은 최대 8자까지 입력 가능합니다.' };
    }
    
    return { valid: true, message: '' };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,20}$/;
    return passwordRegex.test(password);
}

// ===============================================================================================================================================
// 로그인 기록 남기기 함수
// ===============================================================================================================================================
function logSuccessfulLogin(dbConnection, userId, req, provider, callback) {
    // user_logins 테이블에 provider 컬럼이 없다면 추가해야 합니다.
    // ALTER TABLE user_logins ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'local';
    const logQuery = 'INSERT INTO user_logins (user_id, ip_address, device_info, login_status, provider) VALUES (?, ?, ?, ?, ?)';
    const ipAddress = req.ip;
    const deviceInfo = req.headers['user-agent'];
    const loginStatus = 'success';

    dbConnection.query(logQuery, [userId, ipAddress, deviceInfo, loginStatus, provider], (logErr, logResult) => {
        if (logErr) {
            console.error(`[ERROR] Login log failed for user_id ${userId} via ${provider}:`, logErr);
            // 로그 기록에 실패하더라도 로그인 절차는 계속 진행하도록 콜백을 호출합니다.
            return callback(logErr);
        }
        console.log(`[INFO] Login log recorded for user_id ${userId} via ${provider}, log_id: ${logResult.insertId}`);
        // 에러 없이 성공적으로 완료되면 null을 전달하여 콜백을 호출합니다.
        callback(null);
    });
}

// ===============================================================================================================================================
// 세션 체크 API
// ===============================================================================================================================================
app.get('/api/check-session', (req, res) => {
    // express-session 미들웨어를 통해 생성된 req.session 객체에 userId가 있는지 확인합니다.
    if (req.session && req.session.userId) {
        // 세션에 사용자 정보가 존재하면 로그인 상태로 간주
        res.json({ loggedIn: true, userId: req.session.userId });
    } else {
        // 세션 정보가 없으면 로그아웃 상태로 간주
        res.json({ loggedIn: false });
    }
});

// ===============================================================================================================================================
// 회원가입 처리
// ===============================================================================================================================================
app.post('/api/signup', async (req, res) => {
    const { username, email, password, passwordConfirm, address, detailAddress } = req.body;
    console.log('받은 데이터:', { username, email, password, passwordConfirm, address, detailAddress });

    // 1. 개별 필수 입력값 검증
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return res.status(400).json({ message: usernameValidation.message });
    }

    if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // 이메일 유효성 검사
    if (!validateEmail(email)) {
        return res.status(400).json({ message: '올바른 이메일 형식을 입력해주세요.' });
    }

    if (!password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    // 비밀번호 유효성 검사
    if (!validatePassword(password)) {
        return res.status(400).json({ message: '비밀번호는 8-20자리이며, 영문자와 숫자가 모두 포함되어야 합니다.' });
    }

    if (!passwordConfirm) {
        return res.status(400).json({ message: '비밀번호 확인을 입력해주세요.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
    }

    if (!address) {
        return res.status(400).json({ message: '주소를 입력해주세요.' });
    }

    if (!detailAddress) {
        return res.status(400).json({ message: '상세주소를 입력해주세요.' });
    }

    try {
        const checkUsernameQuery = 'SELECT id FROM users WHERE username = ?';
        const usernameExists = await new Promise((resolve, reject) => {
            db.query(checkUsernameQuery, [username.trim()], (err, results) => {
                if (err) reject(err);
                else resolve(results.length > 0);
            });
        });

        if (usernameExists) {
            return res.status(409).json({ message: '이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.' });
        }

        // 비밀번호 해시화
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertQuery = 'INSERT INTO users (username, email, password, address, detail_address) VALUES (?, ?, ?, ?, ?)';
        db.query(insertQuery, [username, email, hashedPassword, address, detailAddress], (err, result) => {
            if (err) {
                console.error('회원가입 중 오류 발생:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    let dupField = '알 수 없는 필드';
                    if (err.sqlMessage && err.sqlMessage.includes('for key')) {
                        try {
                            const keyInfo = err.sqlMessage.split('for key ')[1].replace(/'/g, "");
                            if (keyInfo.includes('.')) {
                                dupField = keyInfo.split('.')[1].replace('_UNIQUE', '').replace('_PRIMARY', '');
                            } else {
                                dupField = keyInfo.replace('_UNIQUE', '').replace('_PRIMARY', '');
                            }
                        } catch (parseError) {
                            console.error("중복 필드 파싱 오류:", parseError);
                        }
                    }

                    if (dupField.toLowerCase().includes('email')) {
                        return res.status(409).json({ message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.' });
                    }

                    return res.status(409).json({ message: `이미 존재하는 ${dupField} 값입니다.` });
                }

                return res.status(500).json({ message: '회원가입 실패: 데이터베이스 처리 중 오류가 발생했습니다.' });
            }

            // 방금 삽입된 데이터 조회
            const selectQuery = 'SELECT * FROM users WHERE id = ?';
            db.query(selectQuery, [result.insertId], (err, rows) => {
                if (err) {
                    console.error('데이터 조회 중 오류 발생:', err);
                    return res.status(500).json({ message: '회원가입 성공, 그러나 데이터 조회 실패' });
                }

                console.log('회원가입 성공:', rows[0]);
                res.json({ success: true, message: '회원가입 성공!', user: rows[0] });
            });
        });
    } catch (hashError) {
        console.error('비밀번호 해시화 중 오류:', hashError);
        return res.status(500).json({ message: '회원가입 처리 중 오류가 발생했습니다.' });
    }
});

// ===============================================================================================================================================
// 로그인 처리
// ===============================================================================================================================================
app.post('/api/login', async (req, res) => {
    console.log('요청 데이터:', req.body);
    const { email, password } = req.body;

    if (!email || !password || !validateEmail(email)) {
        return res.json({ success: false, message: '이메일과 비밀번호를 올바르게 입력해주세요.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('로그인 중 오류 발생:', err);
            return res.json({ success: false, message: '로그인 실패: 데이터베이스 오류' });
        }

        if (results.length > 0) {
            const user = results[0];
            try {
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    req.session.userId = user.id;
                    req.session.isLoggedIn = true;

                    // 1. 로그인 로그 기록 함수를 호출합니다.
                    logSuccessfulLogin(db, user.id, req, 'local', (logErr) => {
                        if (logErr) {
                            console.error('로그 기록에 실패했지만 로그인은 계속합니다.');
                        }
                        // 2. 로그 기록 시도가 끝난 후(성공/실패 무관) 클라이언트에 응답을 보냅니다.
                        console.log('로그인 성공 및 로그 기록 완료, 응답 전송:', user.email);
                        req.session.save(saveErr => {
                            if (saveErr) {
                                console.error('세션 저장 실패:', saveErr);
                                return res.json({ success: false, message: '세션 저장 중 오류 발생' });
                            }
                            return res.json({ success: true, message: '로그인 성공!', redirectUrl: '/index.html' });
                        });
                    });

                } else {
                    res.json({ success: false, message: '로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.' });
                }
            } catch (compareError) {
                console.error('비밀번호 비교 중 오류:', compareError);
                res.json({ success: false, message: '로그인 처리 중 오류가 발생했습니다.' });
            }
        } else {
            res.json({ success: false, message: '로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.' });
        }
    });
});

// ===============================================================================================================================================
// 카카오 콜백 처리
// ===============================================================================================================================================
app.get('/kakao/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: 'http://localhost:3000/kakao/callback',
                code,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });

        const kakaoUser = userResponse.data;
        const sns_id = kakaoUser.id.toString();
        const username = kakaoUser.kakao_account.profile.nickname;
        const email = kakaoUser.kakao_account.email;
        const provider = 'kakao'; // ▼▼▼ 오류가 발생한 부분 수정: provider 변수 선언 ▼▼▼

        // provider 컬럼이 있는 경우를 가정하여 쿼리 수정
        const selectQuery = 'SELECT * FROM users WHERE sns_id = ? AND provider = ?';
        db.query(selectQuery, [sns_id, provider], (err, rows) => {
            if (err) {
                console.error('[ERROR] /kakao/callback - DB select query failed:', err);
                return res.redirect('/');
            }

            if (rows.length > 0) { // 기존 사용자
                const dbUser = rows[0];
                req.session.userId = dbUser.id;
                req.session.isLoggedIn = true;
                
                logSuccessfulLogin(db, dbUser.id, req, provider, (logErr) => {
                    req.session.save(saveErr => {
                        if (saveErr) {
                            console.error('[ERROR] /kakao/callback - Session save failed:', saveErr);
                            return res.redirect('/');
                        }
                        return res.redirect('/index.html');
                    });
                });

            } else { // 신규 사용자
                const insertUserQuery = 'INSERT INTO users (sns_id, username, email, provider) VALUES (?, ?, ?, ?)';
                db.query(insertUserQuery, [sns_id, username, email, provider], (errInsertUser, result) => {
                    if (errInsertUser) {
                        console.error('[ERROR] /kakao/callback - DB users insert query failed:', errInsertUser);
                        if (errInsertUser.code === 'ER_DUP_ENTRY' && email) {
                            return res.status(409).send('이미 가입된 이메일입니다. 다른 방법으로 로그인해주세요.');
                        }
                        return res.redirect('/');
                    }

                    const userId = result.insertId;
                    req.session.userId = userId;
                    req.session.isLoggedIn = true;

                    logSuccessfulLogin(db, userId, req, provider, (logErr) => {
                        req.session.save(saveErr => {
                            if (saveErr) {
                                console.error('[ERROR] /kakao/callback - Session save failed for new user:', saveErr);
                                return res.redirect('/');
                            }
                            return res.redirect('/index.html');
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('카카오 로그인 중 예외 발생:', error.response?.data || error.message);
        res.status(500).send('카카오 로그인 처리 중 오류가 발생했습니다.');
    }
});

// ===============================================================================================================================================
// 네이버 콜백 처리
// ===============================================================================================================================================
app.get('/naver/callback', async (req, res) => {
    const { code, state } = req.query;
    try {
        const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: NAVER_CLIENT_ID,
                client_secret: NAVER_CLIENT_SECRET,
                code,
                state,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` },
        });
        
        const naverUser = userResponse.data.response;
        const sns_id = naverUser.id.toString();
        const username = naverUser.name || naverUser.nickname;
        const email = naverUser.email;
        const provider = 'naver'; // ▼▼▼ 오류가 발생할 수 있는 부분 수정: provider 변수 선언 ▼▼▼

        const selectQuery = 'SELECT * FROM users WHERE sns_id = ? AND provider = ?';
        db.query(selectQuery, [sns_id, provider], (err, rows) => {
            if (err) {
                console.error('[ERROR] /naver/callback - DB select query failed:', err);
                return res.redirect('/');
            }

            if (rows.length > 0) { // 기존 사용자
                const dbUser = rows[0];
                req.session.userId = dbUser.id;
                req.session.isLoggedIn = true;

                logSuccessfulLogin(db, dbUser.id, req, provider, (logErr) => {
                    req.session.save(saveErr => {
                        if (saveErr) {
                            console.error('[ERROR] /naver/callback - Session save failed:', saveErr);
                            return res.redirect('/');
                        }
                        return res.redirect('/index.html');
                    });
                });

            } else { // 신규 사용자
                const insertUserQuery = 'INSERT INTO users (sns_id, username, email, provider) VALUES (?, ?, ?, ?)';
                db.query(insertUserQuery, [sns_id, username, email, provider], (errInsertUser, result) => {
                    if (errInsertUser) {
                        console.error('[ERROR] /naver/callback - DB users insert query failed:', errInsertUser);
                        if (errInsertUser.code === 'ER_DUP_ENTRY' && email) {
                            return res.status(409).send('이미 가입된 이메일입니다. 다른 방법으로 로그인해주세요.');
                        }
                        return res.redirect('/');
                    }

                    const userId = result.insertId;
                    req.session.userId = userId;
                    req.session.isLoggedIn = true;
                    
                    logSuccessfulLogin(db, userId, req, provider, (logErr) => {
                        req.session.save(saveErr => {
                            if (saveErr) {
                                console.error('[ERROR] /naver/callback - Session save failed for new user:', saveErr);
                                return res.redirect('/');
                            }
                            return res.redirect('/index.html');
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('네이버 로그인 중 예외 발생:', error.response?.data || error.message);
        res.status(500).send('네이버 로그인 처리 중 오류가 발생했습니다.');
    }
});

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];

    if (!token) return res.status(401).json({ message: '토큰이 없습니다.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
        req.user = user;
        next();
    });
}

// // 예: HTML 폼에서 입력값 가져오기
// document.getElementById('loginButton').addEventListener('click', () => {
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     fetch('/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email, password }),
//     })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 // 성공 시 리다이렉트
//                 window.location.href = data.redirectUrl;
//             } else {
//                 // 실패 시 에러 메시지 표시
//                 alert(data.message);
//             }
//         })
//         .catch(error => {
//             console.error('로그인 처리 중 오류:', error);
//         });
// });

// ==================================================================================================================
// 로그아웃 API
// ==================================================================================================================
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('로그아웃 중 오류:', err);
            return res.status(500).json({ success: false });
        }
        
        res.clearCookie('connect.sid'); // 세션 쿠키 삭제
        res.json({ success: true });
    });
});

// ==================================================================================================================
// 유저 정보 가져오기 API
// ==================================================================================================================
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        console.log("로그인 안된 상태로 /api/user 접근 시도");
        return res.json(null);
    }

    const userId = req.session.userId;
    // 쿼리에 u.address와 u.detail_address 추가
    const query = `
        SELECT
            u.id,
            u.username,
            u.email,
            u.address,
            u.detail_address,
            u.profile_intro,
            u.profile_image_path,
            ul.level,
            up.point,
            u.sns_id,
            IFNULL(p.post_count, 0) AS post_count
        FROM users u
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        LEFT JOIN user_points up ON u.id = up.user_id
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS post_count
            FROM posts
            WHERE user_id = ?
            GROUP BY user_id
        ) p ON u.id = p.user_id
        WHERE u.id = ?;
    `;

    db.query(query, [userId, userId], (err, results) => {
        if (err) {
            console.error(`[ERROR] /api/user DB query failed for userId ${userId}:`, err);
            return res.status(500).json({ message: '서버 오류로 사용자 정보를 가져오지 못했습니다.' });
        }

        if (results.length > 0) {
            const userData = results[0];
            userData.level = userData.level || 1;
            userData.point = userData.point || 0;
            if (userData.profile_image_path) {
                userData.profile_image_path = userData.profile_image_path.replace(/\\/g, '/');
            }
            console.log('[INFO] /api/user - User data fetched for userId:', userId, userData);
            return res.json(userData);
        } else {
            console.warn('[WARN] /api/user - User not found in DB for session userId:', userId);
            return res.json(null);
        }
    });
});

// ==================================================================================================================
// 알레르기 정보 조회 API
// ==================================================================================================================
app.get('/api/options/allergens', (req, res) => {
    const query = "SELECT AllergenID, AllergenKor FROM allergen ORDER BY AllergenID";
    db.query(query, (err, results) => {
        if (err) {
            console.error('알레르기 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '알레르기 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// ==================================================================================================================
// 유저 알레르기 정보 조회 API
// ==================================================================================================================
app.get('/api/user/allergens', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const query = `
        SELECT ua.allergen_id, a.AllergenKor 
        FROM user_allergen ua
        JOIN allergen a ON ua.allergen_id = a.AllergenID
        WHERE ua.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('사용자 알레르기 정보 조회 중 오류:', err);
            return res.status(500).json({ message: '알레르기 정보를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// ==================================================================================================================
// 메뉴 알레르기 정보 조회 API
// ==================================================================================================================
app.get('/api/menu/:menuId/allergens', (req, res) => {
    const menuId = req.params.menuId;
    
    if (!menuId || isNaN(parseInt(menuId))) {
        return res.status(400).json({ error: '유효한 메뉴 ID가 필요합니다.' });
    }

    const query = `
        SELECT a.AllergenID, a.AllergenKor
        FROM menuallergen ma
        JOIN allergen a ON ma.AllergenID = a.AllergenID
        WHERE ma.MenuID = ?
        ORDER BY a.AllergenID
    `;

    db.query(query, [menuId], (err, results) => {
        if (err) {
            console.error('메뉴 알레르기 정보 조회 중 오류:', err);
            return res.status(500).json({ error: '알레르기 정보를 조회하는 중 오류가 발생했습니다.' });
        }

        res.json(results);
    });
});

// ==================================================================================================================
// 업로드하는 이미지 서버에 저장하는 API
// ==================================================================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath;
        
        if (file.fieldname === 'profileImage') {
            uploadPath = 'Uploads/Profile_Image/'; // 프로필 이미지 경로
        } else if (file.fieldname === 'postImages') {
            uploadPath = 'Uploads/Post_Image/'; // 게시물 이미지 경로
        } else {
            uploadPath = 'uploads/default/'; // 기본 경로
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'profileImage') {
            // 프로필 이미지의 경우 userId 기반으로 파일명 생성
            const userId = req.session.userId;
            if (userId) {
                const ext = path.extname(file.originalname);
                cb(null, `profileImage-${userId}${ext}`);
            } else {
                cb(new Error('로그인이 필요합니다.'), null);
            }
        } else {
            // 게시물 이미지는 기존 방식 유지
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }
});

const upload = multer({ storage: storage });

// ==================================================================================================================
// 게시글 작성 API
// ==================================================================================================================
app.post('/api/createPost', upload.array('postImages', 10), (req, res) => { // 'postImages'로 변경
    // 1. 로그인 상태 확인
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: '게시물을 작성하려면 로그인이 필요합니다.' });
    }

    const userId = req.session.userId;
    const { title, content } = req.body;
    const files = req.files; // 업로드된 파일들은 Uploads/Post_Image/ 경로에 저장됨

    // 2. 제목 및 내용 유효성 검사
    if (!title || title.trim() === '') {
        return res.status(400).json({ success: false, message: '제목을 입력해주세요.' });
    }

    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
    }

    // 3. posts 테이블에 게시물 정보 삽입
    const insertPostQuery = 'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)';
    db.query(insertPostQuery, [userId, title, content], (err, postResult) => {
        if (err) {
            console.error('DB posts 테이블 삽입 중 오류:', err);
            return res.status(500).json({ success: false, message: '게시물 저장 중 서버 오류가 발생했습니다.' });
        }

        const postId = postResult.insertId;

        // 4. files 테이블에 파일 정보 삽입
        if (files && files.length > 0) {
            const fileInsertPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const insertFileQuery = 'INSERT INTO files (post_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)';
                    // 파일들은 Uploads/Post_Image/ 경로에 저장됨
                    db.query(insertFileQuery, [postId, file.filename, file.path, file.mimetype], (fileErr, fileResult) => {
                        if (fileErr) {
                            console.error('DB files 테이블 삽입 중 오류:', fileErr);
                            return reject(fileErr);
                        }
                        resolve(fileResult);
                    });
                });
            });

            Promise.all(fileInsertPromises)
                .then(() => {
                    // 게시물 작성 성공 후 포인트 증가 (10점, 10분 쿨다운)
                    const userId = req.session.userId;
                    
                    addPointsWithLog(
                        userId, 
                        10, 
                        POINT_ACTIONS.POST_CREATE, 
                        '게시물 작성', 
                        postId, 
                        null, 
                        (err, result) => {
                            if (err) {
                                console.error('포인트 적립 실패:', err);
                                // 포인트 적립 실패해도 게시물 작성은 성공으로 처리
                                return res.json({ 
                                    success: true, 
                                    message: '게시물이 성공적으로 등록되었습니다.', 
                                    postId: postId 
                                });
                            }
                            
                            if (result.onCooldown) {
                                // 쿨다운 중인 경우
                                return res.json({ 
                                    success: true, 
                                    message: `게시물이 성공적으로 등록되었습니다. (${result.message})`, 
                                    postId: postId,
                                    pointCooldown: {
                                        active: true,
                                        remainingTime: result.remainingTime,
                                        message: result.message
                                    }
                                });
                            }
                            
                            // 포인트 적립 성공
                            res.json({ 
                                success: true, 
                                message: `게시물이 성공적으로 등록되었습니다. ${result.addedPoints}점이 적립되었습니다!`, 
                                postId: postId,
                                pointsAdded: result.addedPoints,
                                totalPoints: result.totalPoints,
                                nextPointAvailable: `${COOLDOWN_TIMES.POST_CREATE / 60}분 후`
                            });
                        }
                    );
                })
                .catch(promiseErr => {
                    console.error('파일 정보 일괄 추가 중 오류 발생:', promiseErr);
                    res.status(500).json({ success: false, message: '게시물은 등록되었으나, 파일 정보 저장 중 오류가 발생했습니다.' });
                });
        } else {
            res.json({ success: true, message: '게시물이 성공적으로 등록되었습니다 (이미지 없음).', postId: postId });
        }
    });
});

// ==================================================================================================================
// 게시글 목록 가져오기
// ==================================================================================================================
app.get('/api/posts', (req, res) => {
    const currentUserId = req.session.userId || null;
    
    const query = `
        SELECT
            p.id,
            p.title,
            p.content,
            p.created_at,
            p.user_id,
            p.likes,                    -- likes 필드 추가
            u.username as author_username,
            u.profile_image_path as author_profile_path
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('게시물 조회 오류:', err);
            return res.status(500).json({ error: '서버 오류' });
        }

        // 각 게시물에 대해 이미지 정보 가져오기
        const postPromises = results.map(post => {
            return new Promise((resolve, reject) => {
                const imageQuery = `
                    SELECT REPLACE(file_path, '\\\\', '/') as file_path
                    FROM files
                    WHERE post_id = ?
                    ORDER BY id ASC
                `;

                db.query(imageQuery, [post.id], (imgErr, imageResults) => {
                    if (imgErr) {
                        console.error(`게시물 ${post.id} 이미지 조회 오류:`, imgErr);
                        post.images = [];
                        post.thumbnail_path = null;
                    } else {
                        post.images = imageResults.map(img => img.file_path);
                        post.thumbnail_path = imageResults.length > 0 ? imageResults[0].file_path : null;
                    }

                    // 프로필 이미지 경로 처리
                    if (post.author_profile_path) {
                        post.author_profile_path = post.author_profile_path.replace(/\\/g, '/');
                    } else {
                        post.author_profile_path = 'image/profile-icon.png';
                    }

                    resolve(post);
                });
            });
        });

        Promise.all(postPromises)
            .then(postsWithImages => {
                res.json({
                    posts: postsWithImages,
                    currentUserId: currentUserId // 현재 사용자 ID 추가
                });
            })
            .catch(promiseErr => {
                console.error('게시물 이미지 처리 중 오류:', promiseErr);
                res.status(500).json({ error: '게시물 이미지 처리 중 오류가 발생했습니다.' });
            });
    });
});

// ==================================================================================================================
// 게시글 상세보기
// ==================================================================================================================
app.get('/api/post/:postId', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId; // 세션에서 현재 로그인한 사용자 ID 가져오기

    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ message: '유효한 게시물 ID가 필요합니다.' });
    }

    // 1단계: 조회수 처리 함수 (로그인 사용자 대상)
    const processViewAndIncrement = (callback) => {
        if (!userId) {
            // 비로그인 사용자는 조회수 로직을 건너뛰고 바로 다음 단계로 진행
            return callback();
        }

        const checkViewQuery = `
            SELECT id FROM post_views
            WHERE post_id = ? AND user_id = ? AND viewed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            LIMIT 1;
        `;
        db.query(checkViewQuery, [postId, userId], (err, viewResults) => {
            if (err) {
                console.error(`[ERROR] 조회수 중복 확인 중 DB 오류 (post_id: ${postId}, user_id: ${userId}):`, err);
                return callback(err); // 오류 발생 시 콜백
            }

            if (viewResults.length > 0) {
                // console.log(`[INFO] User ${userId} recently viewed post ${postId}. No view count increment.`);
                return callback(); // 24시간 내 조회 기록 있으면 콜백
            }

            db.beginTransaction(txErr => {
                if (txErr) {
                    console.error('[ERROR] 조회수 트랜잭션 시작 오류:', txErr);
                    return callback(txErr);
                }
                const insertViewQuery = 'INSERT INTO post_views (post_id, user_id) VALUES (?, ?)';
                db.query(insertViewQuery, [postId, userId], (insertErr) => {
                    if (insertErr) {
                        console.error('[ERROR] post_views 삽입 오류:', insertErr);
                        return db.rollback(() => callback(insertErr));
                    }
                    const updateViewsQuery = 'UPDATE posts SET views = views + 1 WHERE id = ?';
                    db.query(updateViewsQuery, [postId], (updateErr) => {
                        if (updateErr) {
                            console.error('[ERROR] posts 조회수 업데이트 오류:', updateErr);
                            return db.rollback(() => callback(updateErr));
                        }
                        db.commit(commitErr => {
                            if (commitErr) {
                                console.error('[ERROR] 조회수 트랜잭션 커밋 오류:', commitErr);
                                return db.rollback(() => callback(commitErr));
                            }
                            console.log(`[INFO] Post ${postId} view count incremented by user ${userId}.`);
                            callback(); // 성공 콜백
                        });
                    });
                });
            });
        });
    };

    // 2단계: 조회수 처리 후 게시물 상세 정보 및 댓글 가져오기
    processViewAndIncrement((viewError) => {
        if (viewError) {
            console.warn("[WARN] 조회수 처리 중 오류가 발생했으나, 게시물 정보 조회는 계속합니다.");
        }

        // 게시물 상세 정보 조회 쿼리
        const postDetailQuery = `
        SELECT
            p.id, 
            p.title, 
            p.content, 
            p.created_at, 
            p.views, 
            p.likes,
            u.id AS user_id, 
            u.username AS author_username, 
            u.profile_image_path AS author_profile_path,
            COALESCE(ul.level, 1) AS author_level,  -- 레벨 정보 추가
            (SELECT REPLACE(file_path, '\\\\', '/') FROM files WHERE post_id = p.id ORDER BY id ASC LIMIT 1) AS thumbnail_path,
            COALESCE((SELECT JSON_ARRAYAGG(REPLACE(file_path, '\\\\', '/')) FROM files WHERE post_id = p.id ORDER BY id ASC), '[]') AS images
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_levels ul ON u.id = ul.user_id  -- user_levels 테이블 조인
        WHERE p.id = ?;
        `;

        db.query(postDetailQuery, [postId], (err, postResults) => {
            if (err) {
                console.error(`[ERROR] 게시물 상세 정보(ID: ${postId}) 가져오기 중 DB 오류:`, err);
                return res.status(500).json({ message: '게시물 정보를 가져오는 데 실패했습니다.' });
            }
            if (postResults.length === 0) {
                return res.status(404).json({ message: '해당 게시물을 찾을 수 없습니다.' });
            }

            const postDetail = postResults[0];
            try {
                postDetail.images = JSON.parse(postDetail.images);
            } catch (e) {
                console.error(`[ERROR] 게시물(ID: ${postId}) 이미지 파싱 오류:`, e);
                postDetail.images = [];
            }

            // 댓글 정보 가져오기
            const getCommentsQuery = `
                SELECT
                    c.id, c.user_id, c.comment, c.created_at,
                    u.username AS author_username,
                    u.profile_image_path AS author_profile_path,
                    COALESCE(ul.level, 1) AS author_level
                FROM comments c
                JOIN users u ON c.user_id = u.id
                LEFT JOIN user_levels ul ON u.id = ul.user_id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC;
            `;
            db.query(getCommentsQuery, [postId], (commentErr, comments) => {
                if (commentErr) {
                    console.error(`[ERROR] 게시물(ID: ${postId})의 댓글 가져오기 중 DB 오류:`, commentErr);
                    postDetail.comments = []; // 댓글 조회 실패 시 빈 배열
                } else {
                    // console.log(`[INFO] 게시물(ID: ${postId}) 댓글 조회 완료 (개수: ${comments.length})`);
                    postDetail.comments = comments;
                }
                res.json(postDetail); // 게시물 상세 정보와 댓글 함께 반환
            });
        });
    });
});

// ==================================================================================================================
// 게시물 수정 API
// ==================================================================================================================
app.put('/api/post/:postId', upload.array('postImages', 10), (req, res) => { // 이미지 수정도 고려하여 multer 사용
    const postId = req.params.postId;
    const userId = req.session.userId; // 현재 로그인한 사용자 ID
    const { title, content, existingImages } = req.body; // existingImages: 기존 이미지 경로 배열 (클라이언트에서 관리)
    const newFiles = req.files; // 새로 업로드된 파일들

    if (!userId) {
        return res.status(401).json({ success: false, message: '게시물을 수정하려면 로그인이 필요합니다.' });
    }
    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ success: false, message: '유효한 게시물 ID가 필요합니다.' });
    }
    if (!title || title.trim() === '') {
        return res.status(400).json({ success: false, message: '제목을 입력해주세요.' });
    }
    if (!content || content.trim() === '') {
        return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
    }

    // 1. 게시물 작성자 확인
    const checkOwnerQuery = 'SELECT user_id FROM posts WHERE id = ?';
    db.query(checkOwnerQuery, [postId], (ownerErr, ownerResults) => {
        if (ownerErr) {
            console.error(`[ERROR] 게시물 작성자 확인 중 DB 오류 (postId: ${postId}):`, ownerErr);
            return res.status(500).json({ success: false, message: '게시물 정보 확인 중 오류가 발생했습니다.' });
        }
        if (ownerResults.length === 0) {
            return res.status(404).json({ success: false, message: '수정할 게시물을 찾을 수 없습니다.' });
        }
        if (ownerResults[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: '자신이 작성한 게시물만 수정할 수 있습니다.' });
        }

        // 2. 게시물 내용 업데이트 (트랜잭션 시작)
        db.beginTransaction(async (txErr) => {
            if (txErr) {
                console.error('[ERROR] 게시물 수정 트랜잭션 시작 오류:', txErr);
                return res.status(500).json({ success: false, message: '서버 오류로 게시물 수정에 실패했습니다.' });
            }

            try {
                // 2-1. posts 테이블 업데이트
                const updatePostQuery = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
                await db.promise().query(updatePostQuery, [title, content, postId]);

                // 2-2. 이미지 처리: 기존 이미지 삭제 및 새 이미지 추가
                // files 테이블에서 해당 post_id의 모든 파일 정보를 가져옵니다.
                const getExistingFilesQuery = 'SELECT id, file_path FROM files WHERE post_id = ?';
                const [currentDbFiles] = await db.promise().query(getExistingFilesQuery, [postId]);

                const clientExistingImages = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];

                // DB에는 있지만 클라이언트가 보내준 existingImages 목록에 없는 파일은 삭제 대상
                const filesToDeleteFromDb = currentDbFiles.filter(dbFile =>
                    !clientExistingImages.some(clientPath => dbFile.file_path.endsWith(clientPath.split('/').pop())) // 경로 비교 단순화
                );

                if (filesToDeleteFromDb.length > 0) {
                    const deleteFileIds = filesToDeleteFromDb.map(f => f.id);
                    const deleteFilesQuery = 'DELETE FROM files WHERE id IN (?)';
                    await db.promise().query(deleteFilesQuery, [deleteFileIds]);
                    // 실제 서버 파일 시스템에서 파일 삭제 로직도 필요 (fs.unlink)
                    filesToDeleteFromDb.forEach(file => {
                        // fs.unlink(file.file_path, (unlinkErr) => {
                        // if (unlinkErr) console.error(`[ERROR] 파일 시스템에서 파일 삭제 오류 (${file.file_path}):`, unlinkErr);
                        // });
                        console.log(`[INFO] DB에서 파일 삭제됨 (ID: ${file.id}, 경로: ${file.file_path}) - 실제 파일 삭제는 주석 처리됨`);
                    });
                }

                // 2-3. 새로 업로드된 파일 정보 삽입
                if (newFiles && newFiles.length > 0) {
                    const newFileInsertPromises = newFiles.map(file => {
                        const insertFileQuery = 'INSERT INTO files (post_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)';
                        return db.promise().query(insertFileQuery, [postId, file.filename, file.path, file.mimetype]);
                    });
                    await Promise.all(newFileInsertPromises);
                }

                await db.promise().commit(); // 모든 작업 성공 시 커밋
                res.json({ success: true, message: '게시물이 성공적으로 수정되었습니다.', postId: postId });

            } catch (error) {
                await db.promise().rollback(); // 오류 발생 시 롤백
                console.error('[ERROR] 게시물 수정 중 트랜잭션 내 오류:', error);
                res.status(500).json({ success: false, message: '게시물 수정 중 오류가 발생했습니다.' });
            }
        });
    });
});

// ==================================================================================================================
// 게시물 삭제 API
// ==================================================================================================================
app.delete('/api/post/:postId', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId; // 현재 로그인한 사용자 ID

    if (!userId) {
        return res.status(401).json({ success: false, message: '게시물을 삭제하려면 로그인이 필요합니다.' });
    }
    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ success: false, message: '유효한 게시물 ID가 필요합니다.' });
    }

    // 1. 게시물 작성자 확인
    const checkOwnerQuery = 'SELECT user_id FROM posts WHERE id = ?';
    db.query(checkOwnerQuery, [postId], (ownerErr, ownerResults) => {
        if (ownerErr) {
            console.error(`[ERROR] 게시물 작성자 확인 중 DB 오류 (postId: ${postId}):`, ownerErr);
            return res.status(500).json({ success: false, message: '게시물 정보 확인 중 오류가 발생했습니다.' });
        }
        if (ownerResults.length === 0) {
            return res.status(404).json({ success: false, message: '삭제할 게시물을 찾을 수 없습니다.' });
        }
        if (ownerResults[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: '자신이 작성한 게시물만 삭제할 수 있습니다.' });
        }

        // 2. 게시물 삭제 (트랜잭션 사용 권장, 여기서는 단순화)
        // posts 테이블에서 ON DELETE CASCADE가 files, comments, post_views에 설정되어 있다면
        // posts 레코드만 삭제해도 관련 자식 레코드들이 자동으로 삭제됩니다.
        // 만약 CASCADE 설정이 없다면, files, comments, post_views 테이블에서 먼저 삭제해야 합니다.
        // 여기서는 CASCADE 설정이 되어 있다고 가정합니다. (실제 DB 스키마 확인 필요)

        // (선택적) 실제 서버 파일 시스템에서 연관된 파일들 삭제
        // const getFilesToDeleteQuery = 'SELECT file_path FROM files WHERE post_id = ?';
        // db.query(getFilesToDeleteQuery, [postId], (fileErr, fileRows) => {
        // if (!fileErr && fileRows.length > 0) {
        // fileRows.forEach(row => {
        // fs.unlink(row.file_path, (unlinkErr) => {
        // if (unlinkErr) console.error(`[ERROR] 파일 시스템 파일 삭제 오류 (${row.file_path}):`, unlinkErr);
        // });
        // });
        // }
        // });

        const deletePostQuery = 'DELETE FROM posts WHERE id = ?';
        db.query(deletePostQuery, [postId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error(`[ERROR] 게시물 삭제 중 DB 오류 (postId: ${postId}):`, deleteErr);
                return res.status(500).json({ success: false, message: '게시물 삭제 중 서버 오류가 발생했습니다.' });
            }
            if (deleteResult.affectedRows > 0) {
                console.log(`[INFO] Post ${postId} deleted successfully by user ${userId}.`);
                res.json({ success: true, message: '게시물이 성공적으로 삭제되었습니다.' });
            } else {
                // 이미 삭제되었거나 존재하지 않는 게시물일 수 있음
                res.status(404).json({ success: false, message: '삭제할 게시물을 찾을 수 없거나 이미 삭제되었습니다.' });
            }
        });
    });
});

// ==================================================================================================================
// 로그인된 사용자의 게시물 목록 가져오기 API
// ==================================================================================================================
app.get('/api/user/posts', (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const query = `
        SELECT 
            p.id,
            p.title,
            p.content,
            p.created_at,
            p.views,
            p.likes,
            (SELECT file_path FROM files WHERE post_id = p.id LIMIT 1) AS thumbnail_path,
            COALESCE((
                SELECT JSON_ARRAYAGG(REPLACE(file_path, '\\\\', '/'))
                FROM files 
                WHERE post_id = p.id
            ), '[]') AS images
        FROM posts p
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('사용자 게시물 조회 중 오류:', err);
            return res.status(500).json({ message: '게시물을 가져오는 데 실패했습니다.' });
        }

        // 이미지 JSON 파싱
        results.forEach(post => {
            try {
                post.images = JSON.parse(post.images);
            } catch (e) {
                console.error(`이미지 파싱 오류 (post ${post.id}):`, e);
                post.images = [];
            }
        });

        res.json(results);
    });
});

// ==================================================================================================================
// 좋아요 토글 API
// ==================================================================================================================
app.post('/api/post/:postId/like', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ success: false, message: '유효한 게시물 ID가 필요합니다.' });
    }

    // 현재 좋아요 상태 확인
    const checkLikeQuery = 'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?';
    
    db.query(checkLikeQuery, [postId, userId], (err, results) => {
        if (err) {
            console.error('좋아요 상태 확인 중 오류:', err);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }

        const isLiked = results.length > 0;
        
        if (isLiked) {
            // 좋아요 취소
            const deleteLikeQuery = 'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?';
            const decrementLikesQuery = 'UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?';
            
            db.query(deleteLikeQuery, [postId, userId], (deleteErr) => {
                if (deleteErr) {
                    console.error('좋아요 취소 중 오류:', deleteErr);
                    return res.status(500).json({ success: false, message: '좋아요 취소 중 오류가 발생했습니다.' });
                }

                db.query(decrementLikesQuery, [postId], (updateErr) => {
                    if (updateErr) {
                        console.error('좋아요 수 감소 중 오류:', updateErr);
                        return res.status(500).json({ success: false, message: '좋아요 수 업데이트 중 오류가 발생했습니다.' });
                    }

                    // 현재 좋아요 수 조회
                    const getLikesQuery = 'SELECT likes FROM posts WHERE id = ?';
                    db.query(getLikesQuery, [postId], (getLikesErr, likesResults) => {
                        if (getLikesErr) {
                            console.error('좋아요 수 조회 중 오류:', getLikesErr);
                            return res.status(500).json({ success: false, message: '좋아요 수 조회 중 오류가 발생했습니다.' });
                        }

                        const currentLikes = likesResults[0]?.likes || 0;
                        res.json({ 
                            success: true, 
                            liked: false, 
                            likes: currentLikes,
                            message: '좋아요를 취소했습니다.' 
                        });
                    });
                });
            });
        } else {
            // 좋아요 추가
            const insertLikeQuery = 'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)';
            const incrementLikesQuery = 'UPDATE posts SET likes = likes + 1 WHERE id = ?';
            
            db.query(insertLikeQuery, [postId, userId], (insertErr) => {
                if (insertErr) {
                    console.error('좋아요 추가 중 오류:', insertErr);
                    return res.status(500).json({ success: false, message: '좋아요 추가 중 오류가 발생했습니다.' });
                }

                db.query(incrementLikesQuery, [postId], (updateErr) => {
                    if (updateErr) {
                        console.error('좋아요 수 증가 중 오류:', updateErr);
                        return res.status(500).json({ success: false, message: '좋아요 수 업데이트 중 오류가 발생했습니다.' });
                    }

                    // 현재 좋아요 수 조회
                    const getLikesQuery = 'SELECT likes FROM posts WHERE id = ?';
                    db.query(getLikesQuery, [postId], (getLikesErr, likesResults) => {
                        if (getLikesErr) {
                            console.error('좋아요 수 조회 중 오류:', getLikesErr);
                            return res.status(500).json({ success: false, message: '좋아요 수 조회 중 오류가 발생했습니다.' });
                        }

                        const currentLikes = likesResults[0]?.likes || 0;
                        res.json({ 
                            success: true, 
                            liked: true, 
                            likes: currentLikes,
                            message: '좋아요를 추가했습니다.' 
                        });
                    });
                });
            });
        }
    });
});

// ==================================================================================================================
// 사용자별 좋아요 상태 확인 API
// ==================================================================================================================
app.get('/api/posts/likes', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.json({ likedPosts: [] });
    }

    const getLikedPostsQuery = 'SELECT post_id FROM post_likes WHERE user_id = ?';
    
    db.query(getLikedPostsQuery, [userId], (err, results) => {
        if (err) {
            console.error('좋아요 상태 조회 중 오류:', err);
            return res.status(500).json({ error: '좋아요 상태 조회 중 오류가 발생했습니다.' });
        }

        const likedPosts = results.map(row => row.post_id);
        res.json({ likedPosts });
    });
});

// ==================================================================================================================
// 사용자가 좋아요한 게시물 목록 가져오기 API
// ==================================================================================================================
app.get('/api/user/liked-posts', (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const query = `
        SELECT
            p.id,
            p.title,
            p.content,
            p.created_at,
            p.views,
            p.likes,
            p.user_id,
            u.username as author_username,
            u.profile_image_path as author_profile_path,
            (SELECT file_path FROM files WHERE post_id = p.id LIMIT 1) AS thumbnail_path,
            COALESCE((
                SELECT JSON_ARRAYAGG(REPLACE(file_path, '\\\\', '/'))
                FROM files
                WHERE post_id = p.id
            ), '[]') AS images
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        INNER JOIN post_likes pl ON p.id = pl.post_id
        WHERE pl.user_id = ?
        ORDER BY pl.liked_at DESC
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('사용자 좋아요 게시물 조회 중 오류:', err);
            return res.status(500).json({ message: '좋아요한 게시물을 가져오는 데 실패했습니다.' });
        }

        // 이미지 JSON 파싱
        results.forEach(post => {
            try {
                post.images = JSON.parse(post.images);
            } catch (e) {
                console.error(`이미지 파싱 오류 (post ${post.id}):`, e);
                post.images = [];
            }

            // 프로필 이미지 경로 처리
            if (post.author_profile_path) {
                post.author_profile_path = post.author_profile_path.replace(/\\/g, '/');
            } else {
                post.author_profile_path = 'image/profile-icon.png';
            }
        });

        res.json(results);
    });
});

// ==================================================================================================================
// 댓글 작성 API
// ==================================================================================================================
app.post('/api/post/:postId/comment', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId; // 세션에서 현재 로그인한 사용자 ID 가져오기
    const { comment } = req.body;

    console.log('댓글 등록 요청:', { postId, userId, comment }); // 디버깅용 로그 추가

    if (!userId) {
        console.log('로그인되지 않은 사용자의 댓글 작성 시도');
        return res.status(401).json({ success: false, message: '댓글을 작성하려면 로그인이 필요합니다.' });
    }

    if (!comment || comment.trim() === '') {
        console.log('빈 댓글 내용으로 작성 시도');
        return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }

    if (!postId || isNaN(parseInt(postId))) {
        console.log('유효하지 않은 게시물 ID:', postId);
        return res.status(400).json({ success: false, message: '유효한 게시물 ID가 필요합니다.' });
    }

    const insertCommentQuery = 'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)';
    db.query(insertCommentQuery, [postId, userId, comment], (err, result) => {
        if (err) {
            console.error(`[ERROR] 댓글 작성 중 DB 오류 (post_id: ${postId}, user_id: ${userId}):`, err);
            return res.status(500).json({ success: false, message: '댓글 작성 중 서버 오류가 발생했습니다.' });
        }

        console.log('댓글 작성 성공:', result.insertId);
        
        // 방금 작성된 댓글 정보와 함께 사용자 정보도 반환
        const newCommentId = result.insertId;
        const getNewCommentQuery = `
            SELECT
                c.id, c.post_id, c.user_id, c.comment, c.created_at,
                u.username AS author_username,
                u.profile_image_path AS author_profile_path
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `;

        db.query(getNewCommentQuery, [newCommentId], (errComment, commentData) => {
            if (errComment || commentData.length === 0) {
                console.error(`[ERROR] 방금 작성된 댓글 정보 조회 오류 (comment_id: ${newCommentId}):`, errComment);
                return res.status(201).json({ success: true, message: '댓글이 성공적으로 등록되었습니다 (정보 조회 실패).', commentId: newCommentId });
            }

            // 댓글 작성 성공 후 포인트 증가 (5점, 30초 쿨다운)
            const userId = req.session.userId;
            
            addPointsWithLog(
                userId, 
                5, 
                POINT_ACTIONS.COMMENT_CREATE, 
                '댓글 작성', 
                postId, 
                newCommentId, 
                (err, result) => {
                    if (err) {
                        console.error('포인트 적립 실패:', err);
                        return res.status(201).json({ 
                            success: true, 
                            message: '댓글이 성공적으로 등록되었습니다.', 
                            comment: commentData[0] 
                        });
                    }
                    
                    if (result.onCooldown) {
                        // 쿨다운 중인 경우
                        return res.status(201).json({ 
                            success: true, 
                            message: `댓글이 성공적으로 등록되었습니다. (${result.message})`, 
                            comment: commentData[0],
                            pointCooldown: {
                                active: true,
                                remainingTime: result.remainingTime,
                                message: result.message
                            }
                        });
                    }
                    
                    // 포인트 적립 성공
                    res.status(201).json({ 
                        success: true, 
                        message: `댓글이 성공적으로 등록되었습니다. ${result.addedPoints}점이 적립되었습니다!`, 
                        comment: commentData[0],
                        pointsAdded: result.addedPoints,
                        totalPoints: result.totalPoints,
                        nextPointAvailable: `${COOLDOWN_TIMES.COMMENT_CREATE}초 후`
                    });
                }
            );
        });
    });
});

// ==================================================================================================================
// 포인트 쿨다운 상태 확인 API
// ==================================================================================================================
app.get('/api/user/point-cooldowns', (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const cooldownStatus = {};
    
    // 각 액션 타입별 쿨다운 상태 확인
    Object.keys(POINT_ACTIONS).forEach(actionKey => {
        const actionType = POINT_ACTIONS[actionKey];
        const cooldownCheck = checkPointCooldown(userId, actionType);
        
        cooldownStatus[actionType] = {
            onCooldown: cooldownCheck.onCooldown,
            remainingTime: cooldownCheck.remainingTime || 0,
            remainingTimeText: cooldownCheck.onCooldown ? formatTime(cooldownCheck.remainingTime) : null,
            maxCooldownTime: COOLDOWN_TIMES[actionType]
        };
    });

    res.json({
        success: true,
        cooldowns: cooldownStatus
    });
});

// ==================================================================================================================
// 만료된 쿨다운 정리 (1분마다 실행)
// ==================================================================================================================
setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, expirationTime] of pointCooldowns.entries()) {
        if (now >= expirationTime) {
            pointCooldowns.delete(key);
            cleanedCount++;
        }
    }
    
    if (cleanedCount > 0) {
        console.log(`[INFO] 만료된 포인트 쿨다운 ${cleanedCount}개 정리됨`);
    }
}, 60000); // 1분마다 실행

// ==================================================================================================================
// 댓글 목록 가져오기 API
// ==================================================================================================================
app.get('/api/post/:postId/comments', (req, res) => {
    const postId = req.params.postId;
    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ message: '유효한 게시물 ID가 필요합니다.' });
    }

    // user_levels 테이블과 LEFT JOIN하여 레벨 정보 포함
    const getCommentsQuery = `
        SELECT
            c.id,
            c.post_id,
            c.user_id,
            c.comment,
            c.created_at,
            u.username AS author_username,
            u.profile_image_path AS author_profile_path,
            COALESCE(ul.level, 1) AS author_level
        FROM comments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC;
    `;

    db.query(getCommentsQuery, [postId], (err, comments) => {
        if (err) {
            console.error(`[ERROR] 댓글 목록 가져오기 중 DB 오류 (post_id: ${postId}):`, err);
            return res.status(500).json({ message: '댓글 목록을 가져오는 데 실패했습니다.' });
        }

        res.json(comments);
    });
});

// ==================================================================================================================
// 댓글 수정 API
// ==================================================================================================================
app.put('/api/comment/:commentId', (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.session.userId;
    const { comment } = req.body;

    console.log('댓글 수정 요청:', { commentId, userId, comment }); // 디버깅용

    // 로그인 확인
    if (!userId) {
        return res.status(401).json({ success: false, message: '댓글을 수정하려면 로그인이 필요합니다.' });
    }

    // 댓글 내용 확인
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }

    // 댓글 ID 확인
    if (!commentId || isNaN(parseInt(commentId))) {
        return res.status(400).json({ success: false, message: '유효한 댓글 ID가 필요합니다.' });
    }

    // 1. 댓글 작성자 확인
    const checkOwnerQuery = 'SELECT user_id FROM comments WHERE id = ?';
    db.query(checkOwnerQuery, [commentId], (ownerErr, ownerResults) => {
        if (ownerErr) {
            console.error('댓글 작성자 확인 중 DB 오류:', ownerErr);
            return res.status(500).json({ success: false, message: '댓글 정보 확인 중 오류가 발생했습니다.' });
        }

        if (ownerResults.length === 0) {
            return res.status(404).json({ success: false, message: '수정할 댓글을 찾을 수 없습니다.' });
        }

        if (ownerResults[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: '자신이 작성한 댓글만 수정할 수 있습니다.' });
        }

        // 2. 댓글 수정
        const updateCommentQuery = 'UPDATE comments SET comment = ?, updated_at = NOW() WHERE id = ?';
        db.query(updateCommentQuery, [comment, commentId], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('댓글 수정 중 DB 오류:', updateErr);
                return res.status(500).json({ success: false, message: '댓글 수정 중 서버 오류가 발생했습니다.' });
            }

            if (updateResult.affectedRows > 0) {
                console.log(`댓글 ${commentId} 수정 성공`);
                res.json({ success: true, message: '댓글이 성공적으로 수정되었습니다.' });
            } else {
                res.status(404).json({ success: false, message: '수정할 댓글을 찾을 수 없거나 이미 삭제되었습니다.' });
            }
        });
    });
});

// ==================================================================================================================
// 댓글 삭제 API
// ==================================================================================================================
app.delete('/api/comment/:commentId', (req, res) => {
    const commentId = req.params.commentId;
    const userId = req.session.userId;

    console.log('댓글 삭제 요청:', { commentId, userId }); // 디버깅용

    // 로그인 확인
    if (!userId) {
        return res.status(401).json({ success: false, message: '댓글을 삭제하려면 로그인이 필요합니다.' });
    }

    // 댓글 ID 확인
    if (!commentId || isNaN(parseInt(commentId))) {
        return res.status(400).json({ success: false, message: '유효한 댓글 ID가 필요합니다.' });
    }

    // 1. 댓글 작성자 확인
    const checkOwnerQuery = 'SELECT user_id FROM comments WHERE id = ?';
    db.query(checkOwnerQuery, [commentId], (ownerErr, ownerResults) => {
        if (ownerErr) {
            console.error('댓글 작성자 확인 중 DB 오류:', ownerErr);
            return res.status(500).json({ success: false, message: '댓글 정보 확인 중 오류가 발생했습니다.' });
        }

        if (ownerResults.length === 0) {
            return res.status(404).json({ success: false, message: '삭제할 댓글을 찾을 수 없습니다.' });
        }

        if (ownerResults[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: '자신이 작성한 댓글만 삭제할 수 있습니다.' });
        }

        // 2. 댓글 삭제
        const deleteCommentQuery = 'DELETE FROM comments WHERE id = ?';
        db.query(deleteCommentQuery, [commentId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('댓글 삭제 중 DB 오류:', deleteErr);
                return res.status(500).json({ success: false, message: '댓글 삭제 중 서버 오류가 발생했습니다.' });
            }

            if (deleteResult.affectedRows > 0) {
                console.log(`댓글 ${commentId} 삭제 성공`);
                res.json({ success: true, message: '댓글이 성공적으로 삭제되었습니다.' });
            } else {
                res.status(404).json({ success: false, message: '삭제할 댓글을 찾을 수 없거나 이미 삭제되었습니다.' });
            }
        });
    });
});

// ==================================================================================================================
// 프로필 수정 API
// ==================================================================================================================
app.put('/api/user/profile', upload.single('profileImage'), async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const { username, profileDescription, password, passwordConfirm, address, detailAddress, allergens } = req.body;
    const profileImageFile = req.file;

    // 닉네임 변경 시 유효성 검사
    if (username) {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            return res.status(400).json({ success: false, message: usernameValidation.message });
        }

        try {
            const checkUsernameQuery = 'SELECT id FROM users WHERE username = ? AND id != ?';
            const usernameExists = await new Promise((resolve, reject) => {
                db.query(checkUsernameQuery, [username.trim(), userId], (err, results) => {
                    if (err) reject(err);
                    else resolve(results.length > 0);
                });
            });
            if (usernameExists) {
                return res.status(409).json({ success: false, message: '이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해주세요.' });
            }
        } catch (error) {
            console.error('닉네임 중복 확인 중 오류:', error);
            return res.status(500).json({ success: false, message: '닉네임 확인 중 오류가 발생했습니다.' });
        }
    }

    // 비밀번호 변경 시 유효성 검사
    if (password) {
        if (!validatePassword(password)) {
            return res.status(400).json({ success: false, message: '비밀번호는 8-20자리이며, 영문자와 숫자가 모두 포함되어야 합니다.' });
        }
        if (password !== passwordConfirm) {
            return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }
    }

    // 트랜잭션 시작
    db.beginTransaction(async (txErr) => {
        if (txErr) {
            console.error('프로필 수정 트랜잭션 시작 오류:', txErr);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }

        try {
            // 업데이트할 필드들 준비
            let updateFields = [];
            let updateValues = [];

            if (username) {
                updateFields.push('username = ?');
                updateValues.push(username.trim());
            }
            if (profileDescription) {
                updateFields.push('profile_intro = ?');
                updateValues.push(profileDescription);
            }
            if (address) {
                updateFields.push('address = ?');
                updateValues.push(address);
            }
            if (detailAddress) {
                updateFields.push('detail_address = ?');
                updateValues.push(detailAddress);
            }
            if (password) {
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                updateFields.push('password = ?');
                updateValues.push(hashedPassword);
            }
            if (profileImageFile) {
                updateFields.push('profile_image_path = ?');
                updateValues.push(profileImageFile.path);
            }

            // 사용자 정보 업데이트
            if (updateFields.length > 0) {
                updateValues.push(userId);
                const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
                await db.promise().query(updateQuery, updateValues);
            }

            // 알레르기 정보 업데이트
            if (allergens !== undefined) {
                // 기존 알레르기 정보 삭제
                await db.promise().query('DELETE FROM user_allergen WHERE user_id = ?', [userId]);
                
                // 새로운 알레르기 정보 추가
                if (allergens && allergens.length > 0) {
                    const allergenList = Array.isArray(allergens) ? allergens : allergens.split(',');
                    const insertPromises = allergenList.map(allergenId => {
                        return db.promise().query('INSERT INTO user_allergen (user_id, allergen_id) VALUES (?, ?)', [userId, parseInt(allergenId)]);
                    });
                    await Promise.all(insertPromises);
                }
            }

            await db.promise().commit();
            res.json({ success: true, message: '프로필이 성공적으로 수정되었습니다.' });

        } catch (error) {
            await db.promise().rollback();
            console.error('프로필 수정 중 오류:', error);
            res.status(500).json({ success: false, message: '프로필 수정에 실패했습니다.' });
        }
    });
});

// ==================================================================================================================
// 게시물 검색 API (고급 검색 기능 포함)
// ==================================================================================================================
app.get('/api/posts/search', (req, res) => {
    const { 
        query, 
        searchType = 'all', 
        sortBy = 'date', 
        dateFrom, 
        dateTo, 
        minViews, 
        maxViews,
        page = 1,
        limit = 10
    } = req.query;
    
    if (!query || query.trim() === '') {
        return res.status(400).json({ error: '검색어를 입력해주세요.' });
    }
    
    // 검색 조건 구성
    let searchCondition = '';
    let searchParams = [];
    
    switch (searchType) {
        case 'title':
            searchCondition = 'WHERE p.title LIKE ?';
            searchParams = [`%${query}%`];
            break;
        case 'content':
            searchCondition = 'WHERE p.content LIKE ?';
            searchParams = [`%${query}%`];
            break;
        case 'author':
            searchCondition = 'WHERE u.username LIKE ?';
            searchParams = [`%${query}%`];
            break;
        case 'titleAndContent':
            searchCondition = 'WHERE (p.title LIKE ? AND p.content LIKE ?)';
            searchParams = [`%${query}%`, `%${query}%`];
            break;
        default: // 'all'
            searchCondition = 'WHERE (p.title LIKE ? OR p.content LIKE ? OR u.username LIKE ?)';
            searchParams = [`%${query}%`, `%${query}%`, `%${query}%`];
    }
    
    // 날짜 필터 추가
    if (dateFrom) {
        searchCondition += ' AND p.created_at >= ?';
        searchParams.push(dateFrom);
    }
    if (dateTo) {
        searchCondition += ' AND p.created_at <= ?';
        searchParams.push(dateTo + ' 23:59:59');
    }
    
    // 조회수 필터 추가
    if (minViews) {
        searchCondition += ' AND p.views >= ?';
        searchParams.push(parseInt(minViews));
    }
    if (maxViews) {
        searchCondition += ' AND p.views <= ?';
        searchParams.push(parseInt(maxViews));
    }
    
    // 정렬 조건
    let orderBy = '';
    switch (sortBy) {
        case 'views':
            orderBy = 'ORDER BY p.views DESC';
            break;
        case 'likes':
            orderBy = 'ORDER BY p.likes DESC';
            break;
        case 'comments':
            orderBy = 'ORDER BY comment_count DESC';
            break;
        case 'title':
            orderBy = 'ORDER BY p.title ASC';
            break;
        case 'author':
            orderBy = 'ORDER BY u.username ASC';
            break;
        default: // 'date'
            orderBy = 'ORDER BY p.created_at DESC';
    }
    
    // 페이지네이션
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitClause = `LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    // 전체 개수 조회 쿼리
    const countQuery = `
        SELECT COUNT(*) as total
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ${searchCondition}
    `;
    
    // 검색 결과 조회 쿼리
    const searchQuery = `
        SELECT
            p.id,
            p.title,
            p.content,
            p.created_at,
            p.views,
            p.likes,
            p.user_id,
            u.username as author_username,
            u.profile_image_path as author_profile_path,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        ${searchCondition}
        ${orderBy}
        ${limitClause}
    `;
    
    // 전체 개수 먼저 조회
    db.query(countQuery, searchParams, (countErr, countResults) => {
        if (countErr) {
            console.error('검색 개수 조회 중 오류:', countErr);
            return res.status(500).json({ error: '검색 중 서버 오류가 발생했습니다.' });
        }
        
        const totalCount = countResults[0].total;
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        
        // 검색 결과 조회
        db.query(searchQuery, searchParams, (err, results) => {
            if (err) {
                console.error('검색 중 오류:', err);
                return res.status(500).json({ error: '검색 중 서버 오류가 발생했습니다.' });
            }
            
            // 각 게시물에 대해 이미지 정보 가져오기
            const postPromises = results.map(post => {
                return new Promise((resolve, reject) => {
                    const imageQuery = `
                        SELECT REPLACE(file_path, '\\\\', '/') as file_path 
                        FROM files 
                        WHERE post_id = ? 
                        ORDER BY id ASC
                    `;
                    
                    db.query(imageQuery, [post.id], (imgErr, imageResults) => {
                        if (imgErr) {
                            console.error(`게시물 ${post.id} 이미지 조회 오류:`, imgErr);
                            post.images = [];
                            post.thumbnail_path = null;
                        } else {
                            post.images = imageResults.map(img => img.file_path);
                            post.thumbnail_path = imageResults.length > 0 ? imageResults[0].file_path : null;
                        }
                        
                        // 프로필 이미지 경로 처리
                        if (post.author_profile_path) {
                            post.author_profile_path = post.author_profile_path.replace(/\\/g, '/');
                        } else {
                            post.author_profile_path = 'image/profile-icon.png';
                        }
                        
                        resolve(post);
                    });
                });
            });
            
            Promise.all(postPromises)
                .then(postsWithImages => {
                    res.json({
                        success: true,
                        posts: postsWithImages,
                        currentUserId: req.session.userId || null, // 현재 사용자 ID 추가
                        pagination: {
                            currentPage: parseInt(page),
                            totalPages: totalPages,
                            totalCount: totalCount,
                            limit: parseInt(limit),
                            hasNext: parseInt(page) < totalPages,
                            hasPrev: parseInt(page) > 1
                        },
                        searchInfo: {
                            query: query,
                            searchType: searchType,
                            sortBy: sortBy,
                            filters: {
                                dateFrom: dateFrom,
                                dateTo: dateTo,
                                minViews: minViews,
                                maxViews: maxViews
                            }
                        }
                    });
                })
                .catch(promiseErr => {
                    console.error('검색 결과 이미지 처리 중 오류:', promiseErr);
                    res.status(500).json({ error: '검색 결과 처리 중 오류가 발생했습니다.' });
                });
        });
    });
});

// ==================================================================================================================
// 검색어 로깅 API
// ==================================================================================================================
app.post('/api/search/log', (req, res) => {
    const { searchTerm, searchType, resultCount } = req.body;
    const userId = req.session.userId || null;
    
    const insertQuery = `
        INSERT INTO search_logs (user_id, search_term, search_type, result_count)
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(insertQuery, [userId, searchTerm, searchType, resultCount], (err, result) => {
        if (err) {
            console.error('검색 로그 저장 중 오류:', err);
            // 로그 저장 실패는 치명적이지 않으므로 에러를 반환하지 않음
        }
        
 
        res.json({ success: true });
    });
});

// ==================================================================================================================
// 순위 변동 저장소 추가
// ==================================================================================================================
let rankingHistory = [];
let rankingChangeTracker = new Map();
let rankingTimers = new Map();
let lastRankingSnapshot = new Map();

// 순위 변동 정보 저장 함수 수정
function trackRankingChange(searchTerm, oldRank, newRank, changeType) {
    if (rankingTimers.has(searchTerm)) {
        clearTimeout(rankingTimers.get(searchTerm));
        rankingTimers.delete(searchTerm);
        // console.log(`기존 변동 타이머 취소: ${searchTerm}`);
    }
    
    const changeInfo = {
        searchTerm: searchTerm,
        oldRank: oldRank,
        newRank: newRank,
        changeType: changeType,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10분 후 만료
    };
    
    rankingChangeTracker.set(searchTerm, changeInfo);
    // console.log(`순위 변동 추적 (새로운 10분 시작): ${searchTerm} - ${changeType} (${oldRank} → ${newRank})`);
    
    const timerId = setTimeout(() => {
        if (rankingChangeTracker.has(searchTerm)) {
            const currentInfo = rankingChangeTracker.get(searchTerm);
            if (currentInfo.timestamp.getTime() === changeInfo.timestamp.getTime()) {
                rankingChangeTracker.delete(searchTerm);
                rankingTimers.delete(searchTerm);
                // console.log(`순위 변동 정보 만료: ${searchTerm}`);
            }
        }
    }, 10 * 60 * 1000);
    
    rankingTimers.set(searchTerm, timerId);
}

// 순위 스냅샷 업데이트 함수 수정
function updateRankingSnapshot(rankings) {
    const newSnapshot = new Map();
    rankings.forEach((item, index) => {
        newSnapshot.set(item.search_term, {
            rank: index + 1,
            search_count: item.search_count,
            timestamp: new Date()
        });
    });
    
    // 이전 스냅샷과 비교하여 변동 추적
    if (lastRankingSnapshot.size > 0) {
        // console.log('순위 변동 분석 시작...');
        
        // 현재 순위의 각 검색어에 대해 변동 확인
        rankings.forEach((current, index) => {
            const currentRank = index + 1;
            const previousData = lastRankingSnapshot.get(current.search_term);
            
            if (!previousData) {
                // 새로 진입한 검색어
                trackRankingChange(current.search_term, null, currentRank, 'new');
                // console.log(`신규 진입: ${current.search_term} (${currentRank}위)`);
            } else {
                const previousRank = previousData.rank;
                if (previousRank > currentRank) {
                    // 순위 상승 (숫자가 작아짐)
                    trackRankingChange(current.search_term, previousRank, currentRank, 'up');
                    // console.log(`순위 상승: ${current.search_term} (${previousRank}위 → ${currentRank}위) - 기존 변동 취소하고 새로 시작`);
                } else if (previousRank < currentRank) {
                    // 순위 하락 (숫자가 커짐)
                    trackRankingChange(current.search_term, previousRank, currentRank, 'down');
                    // console.log(`순위 하락: ${current.search_term} (${previousRank}위 → ${currentRank}위) - 기존 변동 취소하고 새로 시작`);
                } else {
                    // 순위 동일 - 기존 변동 정보 유지 (새로운 변동 추가하지 않음)
                    // console.log(`순위 유지: ${current.search_term} (${currentRank}위) - 기존 변동 정보 유지`);
                }
            }
        });
        
        // 순위에서 사라진 검색어들의 타이머 정리
        lastRankingSnapshot.forEach((prevData, searchTerm) => {
            const stillExists = rankings.some(current => current.search_term === searchTerm);
            if (!stillExists) {
                // console.log(`순위에서 사라짐: ${searchTerm} (이전 ${prevData.rank}위)`);
                // 사라진 검색어의 타이머 정리
                if (rankingTimers.has(searchTerm)) {
                    clearTimeout(rankingTimers.get(searchTerm));
                    rankingTimers.delete(searchTerm);
                }
                if (rankingChangeTracker.has(searchTerm)) {
                    rankingChangeTracker.delete(searchTerm);
                }
            }
        });
    } else {
        // console.log('첫 번째 순위 스냅샷 생성');
    }
    
    lastRankingSnapshot = newSnapshot;
}

// 현재 유효한 변동 정보 가져오기
function getRankingChangeInfo(searchTerm) {
    const changeInfo = rankingChangeTracker.get(searchTerm);
    if (changeInfo && changeInfo.expiresAt > new Date()) {
        return changeInfo;
    }
    return null;
}

// 순위 스냅샷 업데이트
function updateRankingSnapshot(rankings) {
    const newSnapshot = new Map();
    rankings.forEach((item, index) => {
        newSnapshot.set(item.search_term, {
            rank: index + 1,
            search_count: item.search_count,
            timestamp: new Date()
        });
    });
    
    // 이전 스냅샷과 비교하여 변동 추적
    if (lastRankingSnapshot.size > 0) {
        // console.log('순위 변동 분석 시작...');
        
        // 현재 순위의 각 검색어에 대해 변동 확인
        rankings.forEach((current, index) => {
            const currentRank = index + 1;
            const previousData = lastRankingSnapshot.get(current.search_term);
            
            if (!previousData) {
                // 새로 진입한 검색어
                trackRankingChange(current.search_term, null, currentRank, 'new');
                // console.log(`신규 진입: ${current.search_term} (${currentRank}위)`);
            } else {
                const previousRank = previousData.rank;
                if (previousRank > currentRank) {
                    // 순위 상승 (숫자가 작아짐)
                    trackRankingChange(current.search_term, previousRank, currentRank, 'up');
                    // console.log(`순위 상승: ${current.search_term} (${previousRank}위 → ${currentRank}위)`);
                } else if (previousRank < currentRank) {
                    // 순위 하락 (숫자가 커짐)
                    trackRankingChange(current.search_term, previousRank, currentRank, 'down');
                    // console.log(`순위 하락: ${current.search_term} (${previousRank}위 → ${currentRank}위)`);
                } else {
                    // 순위 동일 - 변동 정보 추가하지 않음
                    // console.log(`순위 유지: ${current.search_term} (${currentRank}위)`);
                }
            }
        });
        
        // 순위에서 사라진 검색어들 확인
        lastRankingSnapshot.forEach((prevData, searchTerm) => {
            const stillExists = rankings.some(current => current.search_term === searchTerm);
            if (!stillExists) {
                // console.log(`순위에서 사라짐: ${searchTerm} (이전 ${prevData.rank}위)`);
                // 필요시 사라진 검색어에 대한 처리 추가
            }
        });
    } else {
        // console.log('첫 번째 순위 스냅샷 생성');
    }
    
    lastRankingSnapshot = newSnapshot;
}

// ==================================================================================================================
// 인기 검색어 순위 API
// ==================================================================================================================
app.get('/api/search/ranking', (req, res) => {
    const { period = 1 } = req.query;
    
    // console.log('순위 조회 요청, period:', period);
    
    const currentRankingQuery = `
        SELECT 
            search_term,
            COUNT(*) as search_count,
            MAX(created_at) as last_searched
        FROM search_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY search_term
        ORDER BY search_count DESC, last_searched DESC
        LIMIT 5
    `;
    
    db.query(currentRankingQuery, [period], (err, currentResults) => {
        if (err) {
            console.error('현재 순위 조회 중 오류:', err);
            return res.status(500).json({ error: '순위 조회 중 오류가 발생했습니다.' });
        }
        
        const rankingWithChange = currentResults.map((item, index) => {
            const currentRank = index + 1;
            const changeInfo = getRankingChangeInfo(item.search_term);
            
            let rankChange = 'same';
            let changeIcon = 'no-change-icon.png';
            let changeText = '-';
            let changeExpiresAt = null;
            
            if (changeInfo) {
                const now = new Date();
                const isExpired = changeInfo.expiresAt <= now;
                
                if (!isExpired) {
                    switch (changeInfo.changeType) {
                        case 'new':
                            rankChange = 'new';
                            changeIcon = 'new-badge';
                            changeText = 'NEW';
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                        case 'up':
                            rankChange = 'up';
                            changeIcon = 'rank-up-icon.png';
                            changeText = `${changeInfo.oldRank - changeInfo.newRank}↑`;
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                        case 'down':
                            rankChange = 'down';
                            changeIcon = 'rank-down-icon.png';
                            changeText = `${changeInfo.newRank - changeInfo.oldRank}↓`;
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                    }
                }
            }
            
            return {
                rank: currentRank,
                search_term: item.search_term,
                search_count: item.search_count,
                rank_change: rankChange,
                change_icon: changeIcon,
                change_text: changeText,
                last_searched: item.last_searched,
                change_expires_at: changeExpiresAt
            };
        });
        
        res.json({
            success: true,
            rankings: rankingWithChange,
            period: period,
            updated_at: new Date().toISOString()
        });
    });
});

// ==================================================================================================================
// 실시간 순위 업데이트를 위한 WebSocket 또는 SSE 대신 폴링 방식
// ==================================================================================================================
app.get('/api/search/ranking/live', (req, res) => {
    // console.log('실시간 순위 조회 요청');
    
    const query = `
        SELECT 
            search_term,
            COUNT(*) as search_count,
            MAX(created_at) as last_searched
        FROM search_logs
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
        GROUP BY search_term
        ORDER BY search_count DESC, last_searched DESC
        LIMIT 5
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('실시간 순위 조회 중 오류:', err);
            return res.status(500).json({ error: '실시간 순위 조회 중 오류가 발생했습니다.' });
        }
        
        // console.log('실시간 순위 결과:', results);
        
        // 순위 변동 추적
        updateRankingSnapshot(results);
        
        // 순위 변동 정보 포함하여 응답 생성
        const rankingWithChange = results.map((item, index) => {
            const currentRank = index + 1;
            const changeInfo = getRankingChangeInfo(item.search_term);
            
            let rankChange = 'same';
            let changeIcon = 'no-change-icon.png';
            let changeText = '-';
            let changeExpiresAt = null;
            
            if (changeInfo) {
                const now = new Date();
                const isExpired = changeInfo.expiresAt <= now;
                
                if (!isExpired) {
                    switch (changeInfo.changeType) {
                        case 'new':
                            rankChange = 'new';
                            changeIcon = 'new-badge';
                            changeText = 'NEW';
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                        case 'up':
                            rankChange = 'up';
                            changeIcon = 'rank-up-icon.png';
                            changeText = `${changeInfo.oldRank - changeInfo.newRank}↑`;
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                        case 'down':
                            rankChange = 'down';
                            changeIcon = 'rank-down-icon.png';
                            changeText = `${changeInfo.newRank - changeInfo.oldRank}↓`;
                            changeExpiresAt = changeInfo.expiresAt;
                            break;
                    }
                }
            }
            
            return {
                rank: currentRank,
                search_term: item.search_term,
                search_count: item.search_count,
                rank_change: rankChange,
                change_icon: changeIcon,
                change_text: changeText,
                last_searched: item.last_searched,
                change_expires_at: changeExpiresAt
            };
        });
        
        res.json({
            success: true,
            live_rankings: rankingWithChange,
            updated_at: new Date().toISOString()
        });
    });
});

// ==================================================================================================================
// 검색 후 게시물 클릭 로그 저장
// ==================================================================================================================
app.post('/api/search/click_log', (req, res) => {
    console.log('[API HIT] /api/search/click_log'); // (D) API가 호출되었는지 확인
    const { searchTerm, clickedPostId } = req.body;
    const userId = req.session.userId || null;

    console.log('[DATA RECEIVED]', { searchTerm, clickedPostId, userId }); // (E) 서버가 받은 데이터 확인

    if (!searchTerm || !clickedPostId) {
        return res.status(400).send();
    }

    const updateLogQuery = `
        UPDATE search_logs 
        SET clicked_post_id = ? 
        WHERE (user_id = ? OR (? IS NULL AND user_id IS NULL)) AND search_term = ? AND clicked_post_id IS NULL
        ORDER BY created_at DESC 
        LIMIT 1
    `;

    db.query(updateLogQuery, [clickedPostId, userId, userId, searchTerm], (err, result) => {
        if (err) {
            console.error('검색 클릭 로그 업데이트 중 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 오류' }); // 오류 시 응답 추가
        }
        
        console.log('[DB RESULT]', result); // (F) DB 쿼리 결과 확인
        
        // 중요: affectedRows가 0이면 업데이트된 행이 없다는 의미
        if (result.affectedRows === 0) {
            console.warn('[DB WARNING] 업데이트된 로그가 없습니다. WHERE 조건이 일치하는 레코드를 찾지 못했습니다.');
        }

        res.status(200).json({ success: true });
    });
});

// ==================================================================================================================
// AI 메뉴 추천 체크박스 DB에서 가져와서 생성
// ==================================================================================================================
// 카테고리 옵션 조회
app.get('/api/options/categories', (req, res) => {
    const query = "SELECT DISTINCT Category FROM Menu WHERE Category IS NOT NULL AND Category != '' ORDER BY Category DESC";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('카테고리 조회 중 오류:', err);
            return res.status(500).json({ message: '카테고리 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// 상황(Need) 옵션 조회
app.get('/api/options/needs', (req, res) => {
    const query = "SELECT NeedID, NeedKor FROM Need ORDER BY NeedID";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('상황 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '상황 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// 목표(Goal) 옵션 조회
app.get('/api/options/goals', (req, res) => {
    const query = "SELECT GoalID, GoalKor FROM Goal ORDER BY GoalID";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('목표 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '목표 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// 계절(season) 옵션 조회
app.get('/api/options/season', (req, res) => {
    const query = "SELECT SeasonID, SeasonKor FROM season ORDER BY SeasonID";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('계절 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '시간대 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// 날씨(Weather) 옵션 조회
app.get('/api/options/weathers', (req, res) => {
    const query = "SELECT WeatherID, WeatherKor FROM Weather ORDER BY WeatherID";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('날씨 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '날씨 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// 시간대(Time) 옵션 조회
app.get('/api/options/times', (req, res) => {
    const query = "SELECT TimeID, TimeKor FROM timecode ORDER BY TimeID";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('시간대 옵션 조회 중 오류:', err);
            return res.status(500).json({ message: '시간대 데이터를 조회하는 중 오류가 발생했습니다.' });
        }
        res.json(results);
    });
});

// AI 메뉴 추천 API


// 1. 한글명 매핑 객체 직접 선언
const needKorMap = {
    "1": "행복", "2": "우울", "3": "스트레스", "4": "피곤", "5": "심심", "6": "분노"
};
const goalKorMap = {
    "1": "위로", "2": "상쾌", "3": "활력", "4": "즐거움", "5": "로맨틱", "6": "추억", "7": "건강", "8": "탐닉"
};
const weatherKorMap = {
    "1": "맑음", "2": "흐림", "3": "바람", "4": "비", "5": "눈"
};
const timeKorMap = {
    "1": "아침", "2": "점심", "3": "저녁", "4": "야식", "5": "간식(티타임)"
};
const seasonKorMap = {
    "1": "봄", "2": "여름", "3": "가을", "4": "겨울"
};
const allergenKorMap = {
    "1": "알류", "2": "우유", "3": "밀", "4": "메밀", "5": "대두", "6": "땅콩", "7": "호두", "8": "잣",
    "9": "복숭아", "10": "토마토", "11": "닭고기", "12": "돼지고기", "13": "소고기", "14": "고등어",
    "15": "게", "16": "새우", "17": "오징어", "18": "조개류", "19": "아황산류"
};

app.get('/api/recommend', async (req, res) => {
    const category_str = req.query.category;
    const need_ids_str = req.query.need;
    const goal_ids_str = req.query.goal;
    const season_ids_str = req.query.season;
    const weather_ids_str = req.query.weather;
    const time_ids_str = req.query.time;
    const allergen_ids_str = req.query.allergen;
    const max_kcal_str = req.query.max_kcal;
    const max_price_str = req.query.max_price;
    const people_count = req.query.people_count || 1;
    const menu_count = req.query.menu_count || 1;
    
    // 사용자 ID 가져오기
    const userId = req.session.userId;
    
    try {
        // 사용자 알레르기 정보 조회
        let userAllergens = [];
        if (userId) {
            const allergenQuery = `
                SELECT ua.allergen_id, a.AllergenKor
                FROM user_allergen ua
                JOIN allergen a ON ua.allergen_id = a.AllergenID
                WHERE ua.user_id = ?
            `;
            
            userAllergens = await new Promise((resolve, reject) => {
                db.query(allergenQuery, [userId], (err, results) => {
                    if (err) {
                        console.error('사용자 알레르기 정보 조회 중 오류:', err);
                        resolve([]); // 오류 시 빈 배열 반환
                    } else {
                        resolve(results);
                    }
                });
            });
        }

        // 프롬프트 동적 생성
        let prompt = `${people_count}명이 먹을 수 있는 메뉴를 ${menu_count}개 추천해줘.\n`;
        
        if (category_str) prompt += `카테고리: ${category_str}\n`;
        if (need_ids_str) {
            const kor = need_ids_str.split(',').map(id => needKorMap[id] || id).join(', ');
            prompt += `상황: ${kor}\n`;
        }
        if (goal_ids_str) {
            const kor = goal_ids_str.split(',').map(id => goalKorMap[id] || id).join(', ');
            prompt += `목표: ${kor}\n`;
        }
        if (weather_ids_str) {
            const kor = weather_ids_str.split(',').map(id => weatherKorMap[id] || id).join(', ');
            prompt += `날씨: ${kor}\n`;
        }
        if (time_ids_str) {
            const kor = time_ids_str.split(',').map(id => timeKorMap[id] || id).join(', ');
            prompt += `시간대: ${kor}\n`;
        }
        if (season_ids_str) {
            const kor = season_ids_str.split(',').map(id => seasonKorMap[id] || id).join(', ');
            prompt += `계절: ${kor}\n`;
        }
        
        // 사용자 등록 알레르기 정보 추가
        if (userAllergens.length > 0) {
            const allergenNames = userAllergens.map(allergen => allergen.AllergenKor).join(', ');
            prompt += `알레르기 주의사항: ${allergenNames}가 들어가는 메뉴는 절대 포함하지 말아주세요.\n`;
        }
        
        // URL 파라미터로 전달된 추가 알레르기 정보 (기존 코드 유지)
        if (allergen_ids_str) {
            const kor = allergen_ids_str.split(',').map(id => allergenKorMap[id] || id).join(', ');
            prompt += `추가 알레르기 주의사항: ${kor}도 피해주세요.\n`;
        }
        
        if (max_kcal_str) prompt += `최대 칼로리: ${max_kcal_str}\n`;
        if (max_price_str) prompt += `인당 최대 가격: ${max_price_str}\n`;
        
        prompt += "메뉴 이름, 간단한 설명, 예상 칼로리, 가격을 알려주고, 해당 메뉴의 알레르기 정보를 알려주세요.";

        // OpenAI API 키 확인
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다.');
            return res.status(500).json({
                error: "OpenAI API 키가 설정되지 않았습니다.",
                gpt: "죄송합니다. 현재 AI 추천 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요."
            });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800,
            temperature: 0.7
        });

        const gptAnswer = completion.choices[0].message.content;
        console.log("===== [AI 추천 프롬프트] =====\n" + prompt);
        console.log("===== [AI 응답] =====\n" + gptAnswer);

        res.json({ gpt: gptAnswer });

    } catch (err) {
        console.error("GPT 응답 실패:", err.message);
        console.error("전체 오류:", err);
        res.status(200).json({
            gpt: "죄송합니다. 현재 AI 추천 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
            error: "GPT 응답 실패"
        });
    }
});

// ==================================================================================================================
// 메뉴 상세 정보 조회 API (AIMenu.js에서 사용)
// ==================================================================================================================
app.get('/api/menu/:menuId', (req, res) => {
    const menuId = req.params.menuId;
    
    if (!menuId || isNaN(parseInt(menuId))) {
        return res.status(400).json({ error: '유효한 메뉴 ID가 필요합니다.' });
    }
    
    const query = `
        SELECT MenuID, MenuKor, Category, kcal, Price, imagePath
        FROM menu 
        WHERE MenuID = ?
    `;
    
    db.query(query, [menuId], (err, results) => {
        if (err) {
            console.error('메뉴 상세 정보 조회 중 오류:', err);
            return res.status(500).json({ error: '메뉴 정보를 조회하는 중 오류가 발생했습니다.' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: '해당 메뉴를 찾을 수 없습니다.' });
        }
        
        // 이미지 경로 정규화
        const menu = results[0];
        if (menu.imagePath) {
            menu.imagePath = menu.imagePath.replace(/\\/g, '/');
        }
        
        res.json(menu);
    });
});

// ==================================================================================================================
// DB 데이터 활용해서 메뉴 필터링 API
// ==================================================================================================================
app.get('/api/recommend-filtered', async (req, res) => {
    const {
        category, need, goal, season, weather, time,
        max_kcal, max_price, people_count = 1, menu_count = 3
    } = req.query;

    const userId = req.session.userId;

    try {
        // 스마트 필터링 적용
        const filterResult = await getFilteredMenusWithFallback({
            category, need, goal, season, weather, time,
            max_kcal, max_price, userId, menu_count
        });
        
        const { menus: filteredMenus, fallbackLevel } = filterResult;
        
        if (filteredMenus.length === 0) {
            return res.json({
                gpt: "죄송합니다. 조건에 맞는 메뉴를 찾을 수 없습니다. 다른 조건으로 시도해주세요.",
                menus: [],
                totalFiltered: 0,
                fallbackLevel: 'none'
            });
        }
        
        // 사용자 알레르기 정보 조회
        let userAllergens = [];
        if (userId) {
            const allergenQuery = `
                SELECT ua.allergen_id, a.AllergenKor
                FROM user_allergen ua
                JOIN allergen a ON ua.allergen_id = a.AllergenID
                WHERE ua.user_id = ?
            `;
            userAllergens = await new Promise((resolve, reject) => {
                db.query(allergenQuery, [userId], (err, results) => {
                    if (err) {
                        console.error('알레르기 정보 조회 오류:', err);
                        resolve([]);
                    } else {
                        resolve(results);
                    }
                });
            });
        }
        
        // GPT 전달용 메뉴 최적화
        const optimizedMenus = optimizeMenusForGPT(filteredMenus, parseInt(menu_count));
        
        // 사용자 조건 상세 정보 구성
        const userConditions = buildUserConditionsText({
            category, need, goal, season, weather, time,
            max_kcal, max_price, people_count, menu_count,
            userAllergens
        });
        
        // 메뉴 목록 생성
        const menuList = optimizedMenus.map(menu => 
            `${menu.MenuKor}(${menu.Category}, ${menu.kcal}kcal, ${menu.Price}원)`
        ).join(', ');

        // 향상된 프롬프트 생성
        let prompt = `다음은 사용자가 요청한 메뉴 추천 조건입니다:\n\n`;
        prompt += `${userConditions}\n\n`;
        prompt += `위 조건을 바탕으로 다음 메뉴 목록에서 ${people_count}명이 먹을 수 있는 메뉴를 ${menu_count}개 추천해주세요:\n\n`;
        prompt += `**메뉴 목록:** ${menuList}\n\n`;
        
        // 폴백 레벨에 따른 안내 메시지 추가
        if (fallbackLevel !== 'none') {
            prompt += `**참고:** 일부 조건을 완화하여 메뉴를 선별했습니다.\n\n`;
        }
        
        prompt += `**응답 형식:**\n`;
        prompt += `다음 형식으로 각 메뉴별로 구분하여 답변해주세요:\n\n`;
        prompt += `=== [메뉴명] ===\n`;
        prompt += `추천 이유: (해당 메뉴만의 구체적인 추천 이유)\n`;
        prompt += `특징: (해당 메뉴의 특징)\n`;
        prompt += `어울리는 조합: (이 메뉴와 함께 먹으면 좋은 사이드메뉴, 음료, 디저트 등을 3-4가지 추천)\n`;
        prompt += `===\n\n`;
        
        prompt += `**추천 요청사항:**\n`;
        prompt += `- 위 메뉴 목록에 있는 정확한 메뉴명을 사용해주세요\n`;
        prompt += `- 각 메뉴별로 구분된 설명을 제공해주세요\n`;
        prompt += `- 사용자의 조건을 고려하여 개별 메뉴의 적합성을 설명해주세요\n`;
        
        if (userAllergens.length > 0) {
            prompt += `- 알레르기 정보를 반드시 확인하여 안전한 메뉴만 추천해주세요\n`;
        }
        
        console.log(`GPT 전달 메뉴 수: ${optimizedMenus.length}/${filteredMenus.length}`);
        console.log(`프롬프트 길이: ${prompt.length}자`);
        // console.log('=== 생성된 프롬프트 ===');
        // console.log(prompt);
        // console.log('========================');

        const requestStartTime = Date.now();
        
        // GPT API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 800, // 더 상세한 응답을 위해 토큰 수 증가
            temperature: 0.7
        });

        const responseTime = Date.now() - requestStartTime;
        const gptResponse = completion.choices[0].message.content;

        console.log(`응답 길이: ${gptResponse.length}자`);
        
        // 추천된 메뉴 추출
        const recommendedMenus = extractRecommendedMenus(gptResponse, filteredMenus, parseInt(menu_count));
        
        const parsedResponse = parseGPTResponseByMenu(gptResponse, recommendedMenus);

        console.log(`GPT 추천 완료: ${recommendedMenus.length}개 메뉴 추출`);
        console.log('추출된 메뉴:', recommendedMenus.map(m => m.MenuKor));

        res.json({
            gpt: gptResponse,
            menus: recommendedMenus,
            menuSpecificResponses: parsedResponse, // 메뉴별 응답 추가
            totalFiltered: filteredMenus.length,
            optimizedCount: optimizedMenus.length,
            fallbackLevel: fallbackLevel,
            promptLength: prompt.length,
            responseLength: gptResponse.length,
            responseTime: responseTime,
            tokenUsage: completion.usage || null,
            extractionInfo: {
                requestedCount: parseInt(menu_count),
                extractedCount: recommendedMenus.length,
                availableCount: filteredMenus.length
            }
        });

    } catch (error) {
        console.error("메뉴 추천 오류:", error);
        res.json({
            gpt: "죄송합니다. 메뉴 추천 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
            error: error.message,
            menus: [],
            totalFiltered: 0
        });
    }
});

// ==================================================================================================================
// 포인트 적립 및 로그 기록 함수
// ==================================================================================================================
function addPointsWithLog(userId, points, actionType, description, postId = null, commentId = null, callback) {
    if (!userId || !points || points <= 0) {
        return callback(new Error('유효하지 않은 파라미터입니다.'));
    }

    // 쿨다운 체크
    const cooldownCheck = checkPointCooldown(userId, actionType);
    if (cooldownCheck.onCooldown) {
        const remainingTimeText = formatTime(cooldownCheck.remainingTime);
        return callback(null, {
            success: false,
            onCooldown: true,
            message: `포인트 적립 대기 시간이 남아있습니다. ${remainingTimeText} 후에 다시 시도해주세요.`,
            remainingTime: cooldownCheck.remainingTime
        });
    }

    // 트랜잭션 시작
    db.beginTransaction((txErr) => {
        if (txErr) {
            console.error('포인트 적립 트랜잭션 시작 오류:', txErr);
            return callback(txErr);
        }

        // 1. user_points 테이블에서 현재 사용자의 포인트 확인
        const checkPointsQuery = 'SELECT id, point FROM user_points WHERE user_id = ?';
        db.query(checkPointsQuery, [userId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('포인트 확인 중 오류:', checkErr);
                return db.rollback(() => callback(checkErr));
            }

            let updatePromise;
            
            if (checkResults.length > 0) {
                // 2-1. 기존 포인트가 있으면 업데이트
                const updatePointsQuery = 'UPDATE user_points SET point = point + ? WHERE user_id = ?';
                updatePromise = new Promise((resolve, reject) => {
                    db.query(updatePointsQuery, [points, userId], (updateErr, updateResult) => {
                        if (updateErr) reject(updateErr);
                        else resolve({ newTotal: checkResults[0].point + points });
                    });
                });
            } else {
                // 2-2. 포인트 레코드가 없으면 새로 생성
                const insertPointsQuery = 'INSERT INTO user_points (user_id, point) VALUES (?, ?)';
                updatePromise = new Promise((resolve, reject) => {
                    db.query(insertPointsQuery, [userId, points], (insertErr, insertResult) => {
                        if (insertErr) reject(insertErr);
                        else resolve({ newTotal: points });
                    });
                });
            }

            // 3. 포인트 업데이트 실행
            updatePromise
                .then((result) => {
                    // 4. 포인트 로그 기록
                    const insertLogQuery = `
                        INSERT INTO point_logs (user_id, points, action_type, description, post_id, comment_id) 
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.query(insertLogQuery, [userId, points, actionType, description, postId, commentId], (logErr, logResult) => {
                        if (logErr) {
                            console.error('포인트 로그 기록 중 오류:', logErr);
                            return db.rollback(() => callback(logErr));
                        }

                        // 5. 트랜잭션 커밋
                        db.commit((commitErr) => {
                            if (commitErr) {
                                console.error('포인트 적립 트랜잭션 커밋 오류:', commitErr);
                                return db.rollback(() => callback(commitErr));
                            }

                            // 6. 쿨다운 설정
                            const cooldownTime = COOLDOWN_TIMES[actionType] || 60;
                            setPointCooldown(userId, actionType, cooldownTime);

                            console.log(`[INFO] 사용자 ${userId}의 포인트가 ${points}점 증가했습니다. (${actionType}) 총 포인트: ${result.newTotal}`);
                            console.log(`[INFO] 쿨다운 설정: ${cooldownTime}초`);
                            
                            callback(null, {
                                success: true,
                                addedPoints: points,
                                totalPoints: result.newTotal,
                                logId: logResult.insertId,
                                cooldownSet: cooldownTime
                            });
                        });
                    });
                })
                .catch((updateErr) => {
                    console.error('포인트 업데이트 중 오류:', updateErr);
                    db.rollback(() => callback(updateErr));
                });
        });
    });
}

// ==================================================================================================================
// 사용자 포인트 로그 조회 API
// ==================================================================================================================
app.get('/api/user/point-logs', (req, res) => {
    const userId = req.session.userId;
    const { page = 1, limit = 20, actionType, pointType } = req.query;
    
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE pl.user_id = ?';
    let queryParams = [userId];

    // 활동 유형 필터
    if (actionType && actionType !== 'all') {
        whereClause += ' AND pl.action_type = ?';
        queryParams.push(actionType);
    }

    // ⭐ 포인트 유형 필터 추가 (적립/차감) ⭐
    if (pointType && pointType !== 'all') {
        if (pointType === 'earned') {
            whereClause += ' AND pl.points > 0';
        } else if (pointType === 'spent') {
            whereClause += ' AND pl.points < 0';
        }
    }

    const query = `
        SELECT
            pl.id,
            pl.points,
            pl.action_type,
            pl.description,
            pl.created_at,
            p.title as post_title,
            c.comment as comment_text
        FROM point_logs pl
        LEFT JOIN posts p ON pl.post_id = p.id
        LEFT JOIN comments c ON pl.comment_id = c.id
        ${whereClause}
        ORDER BY pl.created_at DESC
        LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), offset);

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('포인트 로그 조회 중 오류:', err);
            return res.status(500).json({
                success: false,
                message: '포인트 로그를 가져오는 데 실패했습니다.',
                error: err.message
            });
        }

        // 전체 개수 조회 (같은 WHERE 조건 적용)
        const countQuery = `SELECT COUNT(*) as total FROM point_logs pl ${whereClause}`;
        db.query(countQuery, queryParams.slice(0, -2), (countErr, countResults) => {
            if (countErr) {
                console.error('포인트 로그 개수 조회 중 오류:', countErr);
                return res.status(500).json({
                    success: false,
                    message: '포인트 로그 개수 조회에 실패했습니다.'
                });
            }

            const total = countResults[0].total;
            const totalPages = Math.ceil(total / limit);

            res.json({
                success: true,
                logs: results,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalItems: total,
                    itemsPerPage: parseInt(limit)
                }
            });
        });
    });
});


// ==================================================================================================================
// 포인트 통계 조회 API
// ==================================================================================================================
app.get('/api/user/point-stats', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // 모든 정보를 한 번에 조회하는 쿼리
    const combinedQuery = `
        SELECT 
            (SELECT point FROM user_points WHERE user_id = ?) as current_points,
            (SELECT SUM(points) FROM point_logs WHERE user_id = ?) as total_earned,
            action_type,
            COUNT(*) as count,
            SUM(points) as total_points
        FROM point_logs
        WHERE user_id = ?
        GROUP BY action_type
        ORDER BY total_points DESC
    `;

    db.query(combinedQuery, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('포인트 통계 조회 중 오류:', err);
            return res.status(500).json({ message: '포인트 통계를 가져오는 데 실패했습니다.' });
        }

        if (results.length === 0) {
            return res.json({
                currentPoints: 0,
                totalEarned: 0,
                statistics: []
            });
        }

        const currentPoints = results[0].current_points || 0;
        const totalEarned = results[0].total_earned || 0;

        res.json({
            currentPoints: currentPoints,
            totalEarned: totalEarned,
            statistics: results.map(row => ({
                action_type: row.action_type,
                count: row.count,
                total_points: row.total_points
            }))
        });
    });
});

// ==================================================================================================================
// 서버 시작
// ==================================================================================================================
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

function buildUserConditionsText(conditions) {
    const {
        category, need, goal, season, weather, time,
        max_kcal, max_price, people_count, menu_count,
        userAllergens
    } = conditions;
    
    let conditionsText = `**사용자 요청 조건:**\n`;
    
    // 기본 정보
    conditionsText += `- 인원수: ${people_count}명\n`;
    conditionsText += `- 추천받을 메뉴 수: ${menu_count}개\n`;
    
    // 카테고리
    if (category && category !== 'all') {
        conditionsText += `- 음식 카테고리: ${category}\n`;
    } else {
        conditionsText += `- 음식 카테고리: 상관없음\n`;
    }
    
    // 상황
    if (need && need !== 'all') {
        const needNames = need.split(',').map(id => needKorMap[id] || id).join(', ');
        conditionsText += `- 현재 상황: ${needNames}\n`;
    } else {
        conditionsText += `- 현재 상황: 상관없음\n`;
    }
    
    // 목표
    if (goal && goal !== 'all') {
        const goalNames = goal.split(',').map(id => goalKorMap[id] || id).join(', ');
        conditionsText += `- 원하는 목표: ${goalNames}\n`;
    } else {
        conditionsText += `- 원하는 목표: 상관없음\n`;
    }
    
    // 계절
    if (season && season !== 'all') {
        const seasonNames = season.split(',').map(id => seasonKorMap[id] || id).join(', ');
        conditionsText += `- 계절: ${seasonNames}\n`;
    } else {
        conditionsText += `- 계절: 상관없음\n`;
    }
    
    // 날씨
    if (weather && weather !== 'all') {
        const weatherNames = weather.split(',').map(id => weatherKorMap[id] || id).join(', ');
        conditionsText += `- 날씨: ${weatherNames}\n`;
    } else {
        conditionsText += `- 날씨: 상관없음\n`;
    }
    
    // 시간대
    if (time && time !== 'all') {
        const timeNames = time.split(',').map(id => timeKorMap[id] || id).join(', ');
        conditionsText += `- 식사 시간: ${timeNames}\n`;
    } else {
        conditionsText += `- 식사 시간: 상관없음\n`;
    }
    
    // 칼로리 제한
    if (max_kcal && max_kcal < 2000) {
        conditionsText += `- 칼로리 제한: ${max_kcal}kcal 이하\n`;
    } else {
        conditionsText += `- 칼로리 제한: 없음\n`;
    }
    
    // 가격 제한
    if (max_price && max_price < 50000) {
        conditionsText += `- 가격 제한: ${parseInt(max_price).toLocaleString()}원 이하\n`;
    } else {
        conditionsText += `- 가격 제한: 없음\n`;
    }
    
    // 알레르기 정보
    if (userAllergens && userAllergens.length > 0) {
        const allergenNames = userAllergens.map(a => a.AllergenKor).join(', ');
        conditionsText += `- 알레르기 주의사항: ${allergenNames} (절대 포함하지 말 것)\n`;
    } else {
        conditionsText += `- 알레르기 주의사항: 없음\n`;
    }
    
    return conditionsText;
}

async function getFilteredMenusWithFallback(filterParams) {
    const { category, need, goal, season, weather, time, max_kcal, max_price, userId } = filterParams;
    
    // 필터 우선순위 정의 (중요도 순)
    const filterPriority = [
        { name: 'allergen', required: true },  // 알레르기는 항상 적용
        { name: 'category', weight: 0.9 },
        { name: 'time', weight: 0.8 },
        { name: 'need', weight: 0.7 },
        { name: 'goal', weight: 0.6 },
        { name: 'weather', weight: 0.5 },
        { name: 'season', weight: 0.4 }
    ];
    
    // 1단계: 모든 조건으로 필터링 시도
    let filteredMenus = await applyAllFilters(filterParams);
    console.log(`1단계 결과: ${filteredMenus.length}개 메뉴`);
    
    const requestedMenuCount = parseInt(filterParams.menu_count || 3);
    if (filteredMenus.length < requestedMenuCount) {
        console.log(`필터 완화 시작... (현재 ${filteredMenus.length}개 < 요청 ${requestedMenuCount}개)`);
        
        // 우선순위가 낮은 조건부터 제거
        for (let i = filterPriority.length - 1; i >= 0; i--) {
            const filterToRemove = filterPriority[i];
            
            if (filterToRemove.required) continue; // 필수 조건은 건드리지 않음
            
            const relaxedParams = { ...filterParams };
            delete relaxedParams[filterToRemove.name];
            
            filteredMenus = await applyAllFilters(relaxedParams);
            console.log(`${filterToRemove.name} 제거 후: ${filteredMenus.length}개 메뉴`);
            
            if (filteredMenus.length >= requestedMenuCount) break; // 요청 수 이상 확보 시 중단
        }
    }
    
    // 3단계: 여전히 부족하면 핵심 조건만 유지
    if (filteredMenus.length < requestedMenuCount) {
        console.log('핵심 조건만 적용...');
        const coreParams = {
            category: filterParams.category,
            time: filterParams.time,
            max_kcal: filterParams.max_kcal,
            max_price: filterParams.max_price,
            userId: filterParams.userId
        };
        filteredMenus = await applyAllFilters(coreParams);
    }
    
    // 5단계: 10개 이상일 경우 랜덤으로 10개만 선택 (그대로 유지)
    if (filteredMenus.length > 10) {
        console.log(`메뉴가 ${filteredMenus.length}개로 많아서 랜덤으로 10개 선택`);
        filteredMenus = getRandomMenus(filteredMenus, 10);
    }
    
    return {
        menus: filteredMenus,
        fallbackLevel: getFallbackLevel(filteredMenus.length, requestedMenuCount)
    };
}

// 랜덤으로 메뉴 선택하는 함수 (새로 추가)
function getRandomMenus(menus, count) {
    if (menus.length <= count) {
        return menus;
    }
    
    // Fisher-Yates 셔플 알고리즘 사용
    const shuffled = [...menus]; // 원본 배열 복사
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
}

// 모든 필터 적용 함수
async function applyAllFilters(filterParams) {
    const { category, need, goal, season, weather, time, max_kcal, max_price, userId } = filterParams;
    
    // 사용자 알레르기 정보 조회
    let userAllergens = [];
    if (userId) {
        const allergenQuery = `
            SELECT ua.allergen_id, a.AllergenKor
            FROM user_allergen ua
            JOIN allergen a ON ua.allergen_id = a.AllergenID
            WHERE ua.user_id = ?
        `;
        userAllergens = await new Promise((resolve, reject) => {
            db.query(allergenQuery, [userId], (err, results) => {
                if (err) {
                    console.error('알레르기 정보 조회 오류:', err);
                    resolve([]);
                } else {
                    resolve(results);
                }
            });
        });
    }

    // 복합 필터링 쿼리 구성
    let menuQuery = `
        SELECT DISTINCT m.MenuID, m.MenuKor, m.Category, m.kcal, m.Price, m.imagePath
        FROM menu m
        WHERE 1=1
    `;
    let queryParams = [];

    // 카테고리 필터
    if (category && category !== 'all') {
        menuQuery += ' AND m.Category = ?';
        queryParams.push(category);
    }

    // 상황(Need) 필터
    if (need && need !== 'all') {
        const needIds = need.split(',');
        const placeholders = needIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID IN (
            SELECT MenuID FROM menuneed WHERE NeedID IN (${placeholders})
        )`;
        queryParams.push(...needIds);
    }

    // 목적(Goal) 필터
    if (goal && goal !== 'all') {
        const goalIds = goal.split(',');
        const placeholders = goalIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID IN (
            SELECT MenuID FROM menugoal WHERE GoalID IN (${placeholders})
        )`;
        queryParams.push(...goalIds);
    }

    // 계절(Season) 필터
    if (season && season !== 'all') {
        const seasonIds = season.split(',');
        const placeholders = seasonIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID IN (
            SELECT MenuID FROM menuseason WHERE SeasonID IN (${placeholders})
        )`;
        queryParams.push(...seasonIds);
    }

    // 날씨(Weather) 필터
    if (weather && weather !== 'all') {
        const weatherIds = weather.split(',');
        const placeholders = weatherIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID IN (
            SELECT MenuID FROM menuweather WHERE WeatherID IN (${placeholders})
        )`;
        queryParams.push(...weatherIds);
    }

    // 시간대(Time) 필터
    if (time && time !== 'all') {
        const timeIds = time.split(',');
        const placeholders = timeIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID IN (
            SELECT MenuID FROM menutime WHERE TimeID IN (${placeholders})
        )`;
        queryParams.push(...timeIds);
    }

    // 사용자 알레르기 제외
    if (userAllergens.length > 0) {
        const allergenIds = userAllergens.map(a => a.allergen_id);
        const placeholders = allergenIds.map(() => '?').join(',');
        menuQuery += ` AND m.MenuID NOT IN (
            SELECT MenuID FROM menuallergen WHERE AllergenID IN (${placeholders})
        )`;
        queryParams.push(...allergenIds);
    }

    // 칼로리 필터
    if (max_kcal && max_kcal < 2000) {
        menuQuery += ' AND m.kcal <= ?';
        queryParams.push(parseInt(max_kcal));
    }

    // 가격 필터
    if (max_price && max_price < 50000) {
        menuQuery += ' AND m.Price <= ?';
        queryParams.push(parseInt(max_price));
    }

    menuQuery += ' ORDER BY m.MenuKor';

    // DB에서 필터링된 메뉴 조회
    return new Promise((resolve, reject) => {
        db.query(menuQuery, queryParams, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

// 토큰 사용량 최적화 함수
function optimizeMenusForGPT(menus, requestedCount) {
    const maxMenusForGPT = 10; // 최대 메뉴 수를 10개로 줄임
    
    if (menus.length <= maxMenusForGPT) {
        return menus; // 그대로 전달
    }
    
    // 10개 이상이면 랜덤으로 10개 선택
    console.log(`GPT 최적화: ${menus.length}개 메뉴 중 ${maxMenusForGPT}개 랜덤 선택`);
    return getRandomMenus(menus, maxMenusForGPT);
}

// 스마트 샘플링 함수
function smartSampleMenus(menus, maxCount, requestedCount) {
    // 1. 카테고리별 균등 분배
    const menusByCategory = {};
    menus.forEach(menu => {
        const category = menu.Category || 'etc';
        if (!menusByCategory[category]) menusByCategory[category] = [];
        menusByCategory[category].push(menu);
    });
    
    const categories = Object.keys(menusByCategory);
    const menusPerCategory = Math.floor(maxCount / categories.length);
    const remainder = maxCount % categories.length;
    
    let sampledMenus = [];
    
    categories.forEach((category, index) => {
        const categoryMenus = menusByCategory[category];
        const takeCount = menusPerCategory + (index < remainder ? 1 : 0);
        
        // 각 카테고리에서 다양성을 위해 랜덤 샘플링
        const shuffled = categoryMenus.sort(() => 0.5 - Math.random());
        sampledMenus.push(...shuffled.slice(0, takeCount));
    });
    
    return sampledMenus;
}

function extractRecommendedMenus(gptResponse, filteredMenus, menuCount) {
    const recommendedMenus = [];
    
    // 1차: 정확한 메뉴명 매칭
    filteredMenus.forEach(menu => {
        if (gptResponse.includes(menu.MenuKor)) {
            recommendedMenus.push(menu);
        }
    });
    
    // 2차: 부분 매칭 (1차에서 충분하지 않은 경우)
    if (recommendedMenus.length < menuCount) {
        filteredMenus.forEach(menu => {
            if (recommendedMenus.find(r => r.MenuID === menu.MenuID)) return; // 이미 추가된 메뉴 제외
            
            // 메뉴명의 핵심 키워드로 매칭
            const menuKeywords = menu.MenuKor.split(/[\s\-\_]/); // 공백, 하이픈, 언더스코어로 분리
            const hasKeywordMatch = menuKeywords.some(keyword => 
                keyword.length > 1 && gptResponse.includes(keyword)
            );
            
            if (hasKeywordMatch) {
                recommendedMenus.push(menu);
            }
        });
    }
    
    // 3차: 여전히 부족하면 필터링된 메뉴에서 순서대로 선택
    if (recommendedMenus.length < menuCount) {
        console.log(`GPT 응답에서 메뉴 추출 부족 (${recommendedMenus.length}/${menuCount}), 필터링된 메뉴에서 보충`);
        
        filteredMenus.forEach(menu => {
            if (recommendedMenus.length >= menuCount) return;
            if (recommendedMenus.find(r => r.MenuID === menu.MenuID)) return;
            
            recommendedMenus.push(menu);
        });
    }
    
    return recommendedMenus.slice(0, parseInt(menuCount));
}

// 폴백 레벨 판정 함수
function getFallbackLevel(menuCount) {
    if (menuCount >= 10) return 'none';      // 10개 이상: 완화 없음
    if (menuCount >= 5) return 'light';      // 5-9개: 가벼운 완화
    if (menuCount >= 2) return 'moderate';   // 2-4개: 보통 완화
    return 'heavy';                          // 1개 이하: 심한 완화
}

function parseGPTResponseByMenu(gptResponse, recommendedMenus) {
    const menuResponses = {};
    
    // 전체 총평 추출
    const totalSummaryMatch = gptResponse.match(/\*\*전체 총평:\*\*\s*([\s\S]*?)(?=\n\n|$)/);
    const totalSummary = totalSummaryMatch ? totalSummaryMatch[1].trim() : '';
    
    // 각 메뉴별 응답 파싱
    recommendedMenus.forEach(menu => {
        const menuName = menu.MenuKor;
        
        // 메뉴별 섹션 찾기 (=== [메뉴명] === 형식)
        const menuSectionRegex = new RegExp(`===\\s*\\[?${escapeRegExp(menuName)}\\]?\\s*===\\s*([\\s\\S]*?)(?====|\\*\\*전체 총평|$)`, 'i');
        const menuSectionMatch = gptResponse.match(menuSectionRegex);
        
        if (menuSectionMatch) {
            const menuSection = menuSectionMatch[1].trim();
            
            // 추천 이유 추출
            const reasonMatch = menuSection.match(/추천 이유:\s*(.*?)(?=\n특징:|$)/s);
            const reason = reasonMatch ? reasonMatch[1].trim() : '';
            
            // 특징 추출
            const featureMatch = menuSection.match(/특징:\s*(.*?)(?=\n|$)/s);
            const feature = featureMatch ? featureMatch[1].trim() : '';

            // 어울리는 조합 추출
            const pairingMatch = menuSection.match(/어울리는 조합:\s*(.*?)(?=\n|$)/s);
            const pairing = pairingMatch ? pairingMatch[1].trim() : '';
            
            menuResponses[menuName] = {
                reason: reason || '이 메뉴는 현재 상황과 조건에 적합한 선택입니다.',
                feature: feature || '맛있고 영양가 있는 메뉴입니다.',
                pairing: pairing || '다양한 사이드메뉴와 잘 어울립니다.',
                fullSection: menuSection
            };
        } else {
            // 구조화된 응답을 찾지 못한 경우, 메뉴명이 언급된 부분 찾기
            const mentionRegex = new RegExp(`([^.]*${escapeRegExp(menuName)}[^.]*\\.?)`, 'gi');
            const mentions = gptResponse.match(mentionRegex) || [];
            
            menuResponses[menuName] = {
                reason: mentions.length > 0 ? mentions[0] : `${menuName}은(는) 현재 조건에 적합한 메뉴입니다.`,
                feature: '선택하신 조건에 맞는 훌륭한 메뉴입니다.',
                fullSection: mentions.join(' ')
            };
        }
    });
    
    return {
        menuResponses: menuResponses,
        totalSummary: totalSummary || gptResponse
    };
}

// 정규식 이스케이프 함수
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ==================================================================================================================
// 포인트 적립 쿨다운 관리 시스템
// ==================================================================================================================
const pointCooldowns = new Map();

// 쿨다운 체크 함수
function checkPointCooldown(userId, actionType) {
    const cooldownKey = `${userId}_${actionType}`;
    const now = Date.now();
    
    if (pointCooldowns.has(cooldownKey)) {
        const expirationTime = pointCooldowns.get(cooldownKey);
        if (now < expirationTime) {
            const remainingTime = Math.ceil((expirationTime - now) / 1000);
            return {
                onCooldown: true,
                remainingTime: remainingTime
            };
        } else {
            // 만료된 쿨다운 제거
            pointCooldowns.delete(cooldownKey);
        }
    }
    
    return { onCooldown: false };
}

// 쿨다운 설정 함수
function setPointCooldown(userId, actionType, cooldownSeconds) {
    const cooldownKey = `${userId}_${actionType}`;
    const expirationTime = Date.now() + (cooldownSeconds * 1000);
    pointCooldowns.set(cooldownKey, expirationTime);
    
    // 자동 정리를 위한 타이머 설정
    setTimeout(() => {
        pointCooldowns.delete(cooldownKey);
    }, cooldownSeconds * 1000);
}

// 시간 포맷팅 함수
function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds}초`;
    } else {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
    }
}

// 포인트 액션 타입 상수
const POINT_ACTIONS = {
    POST_CREATE: 'POST_CREATE',
    COMMENT_CREATE: 'COMMENT_CREATE'
};

// 쿨다운 시간 설정 (초 단위)
const COOLDOWN_TIMES = {
    POST_CREATE: 300,    // 10분 (600초)
    COMMENT_CREATE: 30   // 30초
};