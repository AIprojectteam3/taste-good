const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
//89ad63367f00d39537ef72651c1dce55 rest api key
//0ad0234b4cdaf5ff61c8c89276f01dcf js key
const KAKAO_REST_API_KEY = '89ad63367f00d39537ef72651c1dce55';
const KAKAO_REDIRECT_URI = 'http://localhost:3000/kakao/callback';
const JWT_SECRET = 'YOUR_JWT_SECRET';
//4tm4ibvzRt4UK09un3v9 naver key
const NAVER_CLIENT_ID = '4tm4ibvzRt4UK09un3v9';
const NAVER_CLIENT_SECRET = 'aEIsjYJR1G';
const NAVER_REDIRECT_URI = 'http://localhost:3000/naver/callback';

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
app.use(express.static(path.join(__dirname)));

// ===============================================================================================================================================
// 회원가입 처리
// ===============================================================================================================================================
app.post('/api/signup', async (req, res) => {
    const { username, email, password, passwordConfirm, address, detailAddress } = req.body;

    console.log('받은 데이터:', { username, email, password, passwordConfirm, address, detailAddress }); // 디버깅용 로그

    // 1. 개별 필수 입력값 검증
    if (!username) {
        return res.status(400).json({ message: '을 입력해주세요.' });
    }
    if (!email) {
        return res.status(400).json({ message: '이메일(email)을 입력해주세요.' });
    }
    if (!password) {
        return res.status(400).json({ message: '비밀번호(password)를 입력해주세요.' });
    }
    if (!passwordConfirm) {
        return res.status(400).json({ message: '비밀번호 확인(passwordConfirm)을 입력해주세요.' });
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

    // if (!email || !password) {
    //     return res.json({ success: false, message: '모든 필드를 입력해주세요.' });
    // }

    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    console.log('실행 쿼리:', query, [email, password]); // 디버깅용 로그

    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('로그인 중 오류 발생:', err);
            return res.json({ success: false, message: '로그인 실패: 데이터베이스 오류' });
        }

        if (results.length > 0) {
            const user = results[0];
            console.log('로그인 성공:', user);

            // 로그인 성공 시 JSON 응답 반환
            return res.json({ success: true, message: '로그인 성공!' });
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
                client_id: KAKAO_REST_API_KEY, // 카카오 REST API 키
                redirect_uri: 'http://localhost:3000/kakao/callback', // Redirect URI
                code, // 인가 코드
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

        // 사용자 정보 매핑
        const sns_id = kakaoUser.id;
        const username = kakaoUser.kakao_account.profile.nickname;
        const email = kakaoUser.kakao_account.email;

        // 데이터베이스에 사용자 정보 삽입
        const query = `
            INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)
            `;

        db.query(query, [sns_id, username, email], (err, result) => {
            if (err) {
                console.error('DB 삽입 중 오류 발생:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('이미 존재하는 sns_id:', sns_id);
                }
                return res.redirect('/'); // 에러 발생 시 리다이렉트
            }

            console.log('DB 삽입 성공:', result);
            res.redirect('/index.html'); // 성공 시 리다이렉트
        });
    } catch (error) {
        console.error('카카오 로그인 오류:', error.response?.data || error.message);
        res.status(500).send('카카오 로그인 실패');
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
                client_id: NAVER_CLIENT_ID, // 네이버 클라이언트 ID
                client_secret: NAVER_CLIENT_SECRET, // 네이버 클라이언트 시크릿
                code, // 인가 코드
                state, // CSRF 방지를 위한 상태 값
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

        // 사용자 정보 매핑
        const sns_id = naverUser.id; // 네이버 고유 ID
        const username = naverUser.name || naverUser.nickname; // 이름 또는 닉네임
        const email = naverUser.email; // 이메일

        // 데이터베이스에 사용자 정보 삽입
        const query = `
            INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)
        `;

        db.query(query, [sns_id, username, email], (err, result) => {
            if (err) {
                console.error('DB 삽입 중 오류 발생:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('이미 존재하는 sns_id:', sns_id);
                }
                return res.redirect('/'); // 에러 발생 시 리다이렉트
            }

            console.log('DB 삽입 성공:', result);
            res.redirect('/index.html'); // 성공 시 리다이렉트
        });
    } catch (error) {
        console.error('네이버 로그인 오류:', error.response?.data || error.message);
        res.status(500).send('네이버 로그인 실패');
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