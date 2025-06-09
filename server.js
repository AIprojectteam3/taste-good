const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = 3000;
//89ad63367f00d39537ef72651c1dce55 rest api key
//0ad0234b4cdaf5ff61c8c89276f01dcf js key
const KAKAO_REST_API_KEY = '89ad63367f00d39537ef72651c1dce55';
const JWT_SECRET = 'YOUR_JWT_SECRET';
//4tm4ibvzRt4UK09un3v9 naver key
const NAVER_CLIENT_ID = '4tm4ibvzRt4UK09un3v9';
const NAVER_CLIENT_SECRET = 'aEIsjYJR1G';

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 폼 데이터 처리를 위해 추가

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

// 보호된 페이지들에 대한 서버 사이드 검증
app.get(['/index.html', '/myprofile.html'], (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/intro.html');
    }
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'DENY'); // 추가 보안
    
    next();
});
app.use(express.static(path.join(__dirname))); // 정적 파일 제공

app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));

// ===============================================================================================================================================
// 폴더 존재 확인 후 없을 경우 생성
// ===============================================================================================================================================
const fs = require('fs');

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

// ===============================================================================================================================================
// 회원가입 처리
// ===============================================================================================================================================
app.post('/api/signup', async (req, res) => {
    const { username, email, password, passwordConfirm, address, detailAddress } = req.body;

    console.log('받은 데이터:', { username, email, password, passwordConfirm, address, detailAddress }); // 디버깅용 로그

    // 1. 개별 필수 입력값 검증
    if (!username) {
        return res.status(400).json({ message: '닉네임을 입력해주세요.' });
    }
    if (!email) {
        return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }
    if (!password) {
        return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }
    if (!passwordConfirm) {
        return res.status(400).json({ message: '비밀번호 확인을 입력해주세요.' });
    }
    if (!address) {
        return res.status(400).json({ message: '주소를 입력해주세요.' });
    }
    if (!detailAddress) {
        return res.status(400).json({ message: '상세주소를 입력해주세요.' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' });
    }

    const insertQuery = 'INSERT INTO users (username, email, password, address, detail_address) VALUES (?, ?, ?, ?, ?)';
    db.query(insertQuery, [username, email, password, address, detailAddress], (err, result) => {
        if (err) {
            console.error('회원가입 중 오류 발생:', err);
            if (err.code === 'ER_DUP_ENTRY') { // MySQL의 중복 항목 오류 코드 [5]
                // 어떤 키가 중복되었는지 err.sqlMessage 등을 파싱하여 더 구체적인 메시지 제공 가능
                // 예: "Duplicate entry 'test@example.com' for key 'users.email_UNIQUE'"
                let dupField = '알 수 없는 필드';
                if (err.sqlMessage && err.sqlMessage.includes('for key')) {
                    try {
                        // 'users.email_UNIQUE' 와 같은 부분을 추출 시도
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

                // email 필드가 users 테이블의 PRIMARY KEY 또는 UNIQUE KEY로 설정되어 있어야 함
                // DB 테이블 스키마에 따르면 email은 UNI (UNIQUE)로 설정되어 있음.
                if (dupField.toLowerCase().includes('email')) {
                    return res.status(409).json({ message: '이미 사용 중인 이메일입니다. 다른 이메일을 사용해주세요.' });
                }
                // 만약 username도 UNIQUE 제약조건이 있다면 추가 처리 가능
                // else if (dupField.toLowerCase().includes('username')) {
                //     return res.status(409).json({ message: '이미 사용 중인 사용자 이름입니다.' });
                // }
                // 그 외 일반적인 중복 오류 (예: auto_increment id를 수동으로 중복 삽입 시도 등)
                return res.status(409).json({ message: `이미 존재하는 ${dupField} 값입니다.` });

            }
        // 그 외 데이터베이스 오류
        return res.status(500).json({ message: '회원가입 실패: 데이터베이스 처리 중 오류가 발생했습니다.' });
        }

        // 방금 삽입된 데이터 조회
        const selectQuery = 'SELECT * FROM users WHERE id = ?';
        db.query(selectQuery, [result.insertId], (err, rows) => {
            if (err) {
                console.error('데이터 조회 중 오류 발생:', err);
                return res.status(500).json({ message: '회원가입 성공, 그러나 데이터 조회 실패' });
            }

            console.log('회원가입 성공:', rows[0]); // 삽입된 데이터 출력
            res.json({ success: true, message: '회원가입 성공!', user: rows[0] });
        });
    });
});

// ===============================================================================================================================================
// 로그인 처리
// ===============================================================================================================================================
app.post('/api/login', (req, res) => {
    console.log('요청 데이터:', req.body); // 디버깅용 로그

    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    console.log('실행 쿼리:', query, [email, password]); // 디버깅용 로그

    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('로그인 중 오류 발생:', err);
            return res.json({ success: false, message: '로그인 실패: 데이터베이스 오류' });
        }

        if (results.length > 0) {
            const user = results[0];
            req.session.userId = user.id; // 세션에 사용자 ID 저장
            req.session.isLoggedIn = true; // 로그인 상태 플래그 저장
            console.log('로그인 성공:', user);

            // 로그인 성공 시 JSON 응답 반환
            return res.json({ success: true, message: '로그인 성공!', redirectUrl: '/index.html' });
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
        // 카카오 인증 서버에서 액세스 토큰 요청
        const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: KAKAO_REST_API_KEY,
                redirect_uri: 'http://localhost:3000/kakao/callback',
                code,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const accessToken = tokenResponse.data.access_token;

        // 액세스 토큰을 사용해 사용자 정보 요청
        const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const kakaoUser = userResponse.data;
        console.log('카카오 사용자 정보:', kakaoUser);

        const sns_id = kakaoUser.id.toString(); // sns_id는 문자열로 통일하는 것이 좋을 수 있음
        const username = kakaoUser.kakao_account.profile.nickname;
        const email = kakaoUser.kakao_account.email; // 카카오 이메일 (사용자 동의 필요)

        // 1. sns_id로 기존 유저 조회 (sns_type 미사용 시)
        const selectQuery = 'SELECT * FROM users WHERE sns_id = ?';
        db.query(selectQuery, [sns_id], (err, rows) => {
            if (err) {
                console.error('[ERROR] /kakao/callback - DB select query failed:', err);
                return res.redirect('/'); // 오류 발생 시 홈으로 리다이렉트
            }

            if (rows.length > 0) { // 기존 사용자
                const dbUser = rows[0];
                req.session.userId = dbUser.id;
                req.session.isLoggedIn = true;
                // 세션 저장 후 리다이렉트 (검색 결과 [4], [5], [8] 참고)
                req.session.save(errSave => {
                    if (errSave) {
                        console.error('[ERROR] /kakao/callback - Session save failed for existing user:', dbUser.id, errSave);
                        return res.redirect('/'); // 세션 저장 실패 시에도 일단 홈으로
                    }
                    console.log('카카오 기존 사용자 로그인 성공, 세션 저장:', req.session);
                    return res.redirect('/index.html');
                });
            } else { // 신규 사용자
                const insertUserQuery = 'INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)'; // sns_type 미사용
                db.query(insertUserQuery, [sns_id, username, email], (errInsertUser, result) => {
                    if (errInsertUser) {
                        console.error('[ERROR] /kakao/callback - DB users insert query failed:', errInsertUser);
                        if (errInsertUser.code === 'ER_DUP_ENTRY' && email) {
                            return res.status(409).send('이미 가입된 이메일입니다. 다른 방법으로 로그인해주세요.');
                        }
                        return res.redirect('/'); // 기타 DB 삽입 오류
                    }

                    const userId = result.insertId;

                    // 1. 세션 정보 설정
                    req.session.userId = userId;
                    req.session.isLoggedIn = true;
                    console.log('[INFO] /kakao/callback - New Kakao user registered, userId:', userId, '. Session data set.');

                    // ⭐️ 3. 세션 저장 후 리다이렉션 (이것이 핵심 수정 사항)
                    req.session.save(errSave => {
                        if (errSave) {
                            console.error('[ERROR] /kakao/callback - Session save failed for new user:', userId, errSave);
                            return res.redirect('/'); // 세션 저장 실패 시 대처
                        }
                        console.log('[INFO] /kakao/callback - Session saved. Redirecting to /index.html for new user:', userId);
                        return res.redirect('/index.html'); // 최종 리다이렉션
                    });
                });
            }
        });
    } catch (error) {
        console.error('카카오 로그인 중 예외 발생:', error.response?.data || error.message);
        res.status(500).send('카카오 로그인 처리 중 오류가 발생했습니다.');
    }
});

// 네이버 콜백 처리
app.get('/naver/callback', async (req, res) => {
    const { code, state } = req.query;
    try {
        // 네이버 인증 서버에서 액세스 토큰 요청
        const tokenResponse = await axios.post('https://nid.naver.com/oauth2.0/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: NAVER_CLIENT_ID,
                client_secret: NAVER_CLIENT_SECRET,
                code,
                state,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        const accessToken = tokenResponse.data.access_token;

        // 액세스 토큰을 사용해 사용자 정보 요청
        const userResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const naverUser = userResponse.data.response;
        console.log('네이버 사용자 정보:', naverUser);

        const sns_id = naverUser.id.toString();
        const username = naverUser.name || naverUser.nickname;
        const email = naverUser.email;

        // 1. sns_id로 기존 유저 조회 (sns_type 미사용)
        const selectQuery = 'SELECT * FROM users WHERE sns_id = ?';
        db.query(selectQuery, [sns_id], (err, rows) => {
            if (err) {
                console.error('[ERROR] /naver/callback - DB select query failed:', err);
                return res.redirect('/');
            }

            if (rows.length > 0) { // 기존 네이버 연동 사용자
                const dbUser = rows[0];
                req.session.userId = dbUser.id;
                req.session.isLoggedIn = true;
                req.session.save(errSave => { // 세션 저장 후 리다이렉트
                    if (errSave) {
                        console.error('[ERROR] /naver/callback - Session save failed for existing user:', dbUser.id, errSave);
                        return res.redirect('/');
                    }
                    console.log('네이버 기존 사용자 로그인 성공, 세션 저장:', req.session);
                    return res.redirect('/index.html');
                });
            } else { // 신규 네이버 연동 사용자
                // users 테이블 INSERT (sns_type 미사용)
                const insertUserQuery = 'INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)';
                db.query(insertUserQuery, [sns_id, username, email], (errInsertUser, result) => {
                    if (errInsertUser) {
                        console.error('[ERROR] /naver/callback - DB users insert query failed:', errInsertUser);
                        if (errInsertUser.code === 'ER_DUP_ENTRY' && email) {
                            return res.status(409).send('이미 가입된 이메일입니다. 다른 방법으로 로그인해주세요.');
                        }
                        return res.redirect('/');
                    }

                    const userId = result.insertId;

                    // 1. 세션 정보 설정
                    req.session.userId = userId;
                    req.session.isLoggedIn = true;
                    console.log('[INFO] /naver/callback - New Naver user registered, userId:', userId, '. Session data set.');

                    // 2. 부가 정보 삽입 부분에서 user_allergies 관련 코드 제거
                    // const insertAllergyQuery = 'INSERT INTO user_allergies (user_id) VALUES (?)';
                    // db.query(insertAllergyQuery, [userId], (errAlg) => {
                    //     if (errAlg) console.error('[ERROR] /naver/callback - Inserting into user_allergies failed for userId:', userId, errAlg);
                        
                    // 3. 세션 저장 후 리다이렉션 (부가 정보 삽입이 없으므로 바로 실행)
                    req.session.save(errSave => {
                        if (errSave) {
                            console.error('[ERROR] /naver/callback - Session save failed for new user:', userId, errSave);
                            return res.redirect('/'); // 세션 저장 실패 시 대처
                        }
                        console.log('[INFO] /naver/callback - Session saved. Redirecting to /index.html for new user:', userId);
                        return res.redirect('/index.html'); // 최종 리다이렉션
                    });
                    // }); // user_allergies 삽입 콜백 괄호 제거
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
    const query = `
        SELECT
            u.id,
            u.username,
            u.profile_intro,
            u.profile_image_path,
            ul.level,
            up.point,
            sns_id,
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
            userData.point = userData.point || 0; // points -> point로 수정
            
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
                    res.json({ success: true, message: '게시물과 이미지가 성공적으로 등록되었습니다.', postId: postId });
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
    const query = `
        SELECT
            p.id,
            p.title,
            p.content,
            p.created_at,
            p.user_id,
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
                res.json(postsWithImages);
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
                console.log(`[INFO] User ${userId} recently viewed post ${postId}. No view count increment.`);
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
                p.id, p.title, p.content, p.created_at, p.views, p.likes,
                u.id AS user_id, u.username AS author_username, u.profile_image_path AS author_profile_path,
                (SELECT REPLACE(file_path, '\\\\', '/') FROM files WHERE post_id = p.id ORDER BY id ASC LIMIT 1) AS thumbnail_path,
                COALESCE((SELECT JSON_ARRAYAGG(REPLACE(file_path, '\\\\', '/')) FROM files WHERE post_id = p.id ORDER BY id ASC), '[]') AS images
            FROM posts p
            JOIN users u ON p.user_id = u.id
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
                    u.profile_image_path AS author_profile_path
                FROM comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC;
            `;
            db.query(getCommentsQuery, [postId], (commentErr, comments) => {
                if (commentErr) {
                    console.error(`[ERROR] 게시물(ID: ${postId})의 댓글 가져오기 중 DB 오류:`, commentErr);
                    postDetail.comments = []; // 댓글 조회 실패 시 빈 배열
                } else {
                    console.log(`[INFO] 게시물(ID: ${postId}) 댓글 조회 완료 (개수: ${comments.length})`);
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
// 사용자 북마크 API (추후 구현)
// ==================================================================================================================
app.get('/api/user/bookmarks', (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }

    // 현재는 빈 배열 반환 (북마크 기능 구현 후 수정)
    res.json([]);
});

// ==================================================================================================================
// 댓글 작성 API
// ==================================================================================================================
app.post('/api/post/:postId/comment', (req, res) => {
    const postId = req.params.postId;
    const userId = req.session.userId; // 세션에서 현재 로그인한 사용자 ID 가져오기
    const { comment } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: '댓글을 작성하려면 로그인이 필요합니다.' });
    }
    if (!comment || comment.trim() === '') {
        return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }
    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ success: false, message: '유효한 게시물 ID가 필요합니다.' });
    }

    const insertCommentQuery = 'INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)';
    db.query(insertCommentQuery, [postId, userId, comment], (err, result) => {
        if (err) {
            console.error(`[ERROR] 댓글 작성 중 DB 오류 (post_id: ${postId}, user_id: ${userId}):`, err);
            return res.status(500).json({ success: false, message: '댓글 작성 중 서버 오류가 발생했습니다.' });
        }

        // 방금 작성된 댓글 정보와 함께 사용자 정보도 반환하여 클라이언트에서 바로 표시할 수 있도록 함
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
                // 댓글 삽입은 성공했으므로 일단 성공으로 응답하되, 데이터 없이 응답할 수 있음
                return res.status(201).json({ success: true, message: '댓글이 성공적으로 등록되었습니다 (정보 조회 실패).', commentId: newCommentId });
            }
            res.status(201).json({ success: true, message: '댓글이 성공적으로 등록되었습니다.', comment: commentData[0] });
        });
    });
});

// ==================================================================================================================
// 댓글 목록 가져오기 API
// ==================================================================================================================
app.get('/api/post/:postId/comments', (req, res) => {
    const postId = req.params.postId;

    if (!postId || isNaN(parseInt(postId))) {
        return res.status(400).json({ message: '유효한 게시물 ID가 필요합니다.' });
    }

    // 댓글 작성자 정보(닉네임, 프로필 이미지)도 함께 가져오기 위해 users 테이블과 JOIN
    // comments 테이블의 created_at을 기준으로 오름차순 정렬 (오래된 댓글부터)
    const getCommentsQuery = `
        SELECT 
            c.id, c.post_id, c.user_id, c.comment, c.created_at,
            u.username AS author_username,
            u.profile_image_path AS author_profile_path 
        FROM comments c
        JOIN users u ON c.user_id = u.id
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
app.put('/api/user/profile', upload.single('profileImage'), (req, res) => {
    const userId = req.session.userId;
    
    if (!userId) {
        return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
    }

    const { username, profileDescription, password, passwordConfirm } = req.body;
    const profileImageFile = req.file;

    // 비밀번호 변경 시 확인
    if (password && password !== passwordConfirm) {
        return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // 업데이트할 필드들 준비
    let updateFields = [];
    let updateValues = [];

    if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
    }

    if (profileDescription) {
        updateFields.push('profile_intro = ?');
        updateValues.push(profileDescription);
    }

    if (password) {
        updateFields.push('password = ?');
        updateValues.push(password); // 실제로는 해시화 필요
    }

    if (profileImageFile) {
        // 프로필 이미지는 Uploads/Profile_Image/ 경로에 저장됨
        updateFields.push('profile_image_path = ?');
        updateValues.push(profileImageFile.path);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ success: false, message: '수정할 정보가 없습니다.' });
    }

    updateValues.push(userId);
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.query(updateQuery, updateValues, (err, result) => {
        if (err) {
            console.error('프로필 수정 중 오류:', err);
            return res.status(500).json({ success: false, message: '프로필 수정에 실패했습니다.' });
        }

        res.json({ success: true, message: '프로필이 성공적으로 수정되었습니다.' });
    });
});

// ==================================================================================================================
// 서버 시작
// ==================================================================================================================
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});