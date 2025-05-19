const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const multer = require('multer');

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
app.use(express.static(path.join(__dirname)));

// JSON 요청 본문 처리
app.use(express.json());

// 사용자 데이터를 저장할 메모리 객체
const users = [];

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

// 기본 라우트: intro.html 반환
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'intro.html'));
});

// 정적 파일 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'intro.html'));
});
app.use(express.static(path.join(__dirname))); // 정적 파일 제공

const session = require('express-session');

app.use(session({
    secret: 'aVeryL0ngAndRandomStringThatIsHardToGuess!@#$%^&*()', // 세션 암호화 키 (보안상 중요)
    resave: false,                      // 세션이 변경되지 않아도 다시 저장할지 여부
    saveUninitialized: true,            // 초기화되지 않은 세션을 저장소에 저장할지 여부
    cookie: {
        secure: false,                   // HTTPS 환경에서는 true로 설정
        maxAge: 1000 * 60 * 60 * 24     // 쿠키 유효 기간 (예: 1일)
    }
}));

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

// 로그인 처리
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

// 카카오 콜백 처리
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

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

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
// 유저 정보 빼오기
// ==================================================================================================================
app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        console.log("로그인 안된 상태로 /api/user 접근 시도");
        return res.json(null);
    }

    const userId = req.session.userId;
    const query = `
        SELECT
            u.username,
            ul.level,
            up.point,
            IFNULL(p.post_count, 0) AS post_count
        FROM
            users u
        LEFT JOIN
            user_levels ul ON u.id = ul.user_id
        LEFT JOIN
            user_points up ON u.id = up.user_id
        LEFT JOIN (
            SELECT
                user_id,
                COUNT(*) AS post_count
            FROM
                posts
            WHERE user_id = ? -- 특정 사용자의 게시물만 카운트 (성능 개선)
            GROUP BY
                user_id
        ) p ON u.id = p.user_id
        WHERE
            u.id = ?;
    `;
    // posts 서브쿼리의 WHERE 조건에도 userId를 추가하여 특정 유저의 글만 카운트하도록 최적화
    db.query(query, [userId, userId], (err, results) => { // 파라미터 두 번 전달
        if (err) {
            console.error(`[ERROR] /api/user DB query failed for userId ${userId}:`, err);
            return res.status(500).json({ message: '서버 오류로 사용자 정보를 가져오지 못했습니다.' });
        }

        if (results.length > 0) {
            const userData = results[0];
            // level 또는 points가 null일 경우 기본값 설정 (DB에 해당 user_id의 레코드가 없을 수 있음)
            userData.level = userData.level || 1;
            userData.points = userData.points || 0;
            // post_count는 IFNULL로 이미 처리됨
            console.log('[INFO] /api/user - User data fetched for userId:', userId, userData);
            return res.json(userData);
        } else {
            console.warn('[WARN] /api/user - User not found in DB for session userId:', userId);
            // 세션은 유효하나 DB에 해당 유저가 없는 이례적인 상황
            // req.session.destroy((destroyErr) => { // 세션 파기
            //     if (destroyErr) console.error('[ERROR] /api/user - Session destroy failed:', destroyErr);
            // });
            return res.json(null); // 클라이언트에서 비로그인 처리하도록 null 반환
        }
    });
});

// ==================================================================================================================
// 게시글 DB에 저장
// ==================================================================================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'post/uploadImage/'; // 원하는 새 경로
        // fs.mkdirSync(uploadPath, { recursive: true }); // 필요시 동기적으로 폴더 생성 (아래 주의사항 참고)
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.post('/api/createPost', upload.array('images', 10), (req, res) => { // 'images'는 클라이언트에서 보낸 파일 필드명, 최대 5개
    // 1. 로그인 상태 확인
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, message: '게시물을 작성하려면 로그인이 필요합니다.' });
    }
    const userId = req.session.userId; // 세션에서 사용자 ID 가져오기

    const { title, content } = req.body; // 폼 데이터에서 제목과 내용 가져오기
    const files = req.files; // 업로드된 파일 정보 (배열)

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

        const postId = postResult.insertId; // 방금 삽입된 게시물의 ID

        // 4. files 테이블에 파일 정보 삽입 (업로드된 파일이 있는 경우)
        if (files && files.length > 0) {
            const fileInsertPromises = files.map(file => {
                return new Promise((resolve, reject) => {
                    const insertFileQuery = 'INSERT INTO files (post_id, file_name, file_path, file_type) VALUES (?, ?, ?, ?)';
                    // file.filename: multer가 생성한 파일명
                    // file.path: multer가 저장한 전체 경로 (예: "uploads/images-1612345678901-123456789.jpg")
                    // file.mimetype: 파일의 MIME 타입 (예: "image/jpeg")
                    db.query(insertFileQuery, [postId, file.filename, file.path, file.mimetype], (fileErr, fileResult) => {
                        if (fileErr) {
                            console.error('DB files 테이블 삽입 중 오류:', fileErr);
                            return reject(fileErr); // 오류 발생 시 Promise reject
                        }
                        resolve(fileResult); // 성공 시 Promise resolve
                    });
                });
            });

            Promise.all(fileInsertPromises)
                .then(() => {
                    res.json({ success: true, message: '게시물과 이미지가 성공적으로 등록되었습니다.', postId: postId });
                })
                .catch(promiseErr => {
                    // 게시물은 등록되었으나 파일 정보 저장 중 오류 발생.
                    // 실제 프로덕션 환경에서는 롤백(트랜잭션 처리)을 고려해야 합니다.
                    console.error('파일 정보 일괄 추가 중 오류 발생:', promiseErr);
                    res.status(500).json({ success: false, message: '게시물은 등록되었으나, 파일 정보 저장 중 오류가 발생했습니다.' });
                });
        } else {
            // 업로드된 파일이 없는 경우
            res.json({ success: true, message: '게시물이 성공적으로 등록되었습니다 (이미지 없음).', postId: postId });
        }
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});