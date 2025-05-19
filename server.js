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
  host: 'localhost',      // MySQL 서버 주소
  port: 8306,             // MySQL 포트 번호
  user: 'root',           // MySQL 사용자 이름
  password: '0000',       // MySQL 비밀번호
  database: 'userdb',     // 사용할 데이터베이스 이름
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

// 회원가입 처리
app.post('/api/signup', (req, res) => {
  const { username, email, password, address, detailAddress } = req.body;

  console.log('받은 데이터:', { username, email, password, address, detailAddress }); // 디버깅용 로그

  if (!username || !email || !password || !address || !detailAddress) {
    return res.json({ success: false, message: '모든 필드를 입력해주세요.' });
  }

  const insertQuery = 'INSERT INTO users (username, email, password, address, detail_address) VALUES (?, ?, ?, ?, ?)';
  db.query(insertQuery, [username, email, password, address, detailAddress], (err, result) => {
    if (err) {
      console.error('회원가입 중 오류 발생:', err);
      return res.status(500).json({ message: '회원가입 실패: 데이터베이스 오류' });
    }

    const userId = result.insertId;

    // user_levels, user_points, user_allergies에 기본값 삽입
    const insertLevel = 'INSERT INTO user_levels (user_id, level) VALUES (?, 1)';
    const insertPoint = 'INSERT INTO user_points (user_id, point) VALUES (?, 0)';
    const insertAllergy = 'INSERT INTO user_allergies (user_id) VALUES (?)';

    db.query(insertLevel, [userId], (err1) => {
      if (err1) console.error('user_levels 입력 오류:', err1);
      db.query(insertPoint, [userId], (err2) => {
        if (err2) console.error('user_points 입력 오류:', err2);
        db.query(insertAllergy, [userId], (err3) => {
          if (err3) console.error('user_allergies 입력 오류:', err3);

          // 방금 삽입된 데이터 조회
          const selectQuery = 'SELECT * FROM users WHERE id = ?';
          db.query(selectQuery, [userId], (err, rows) => {
            if (err) {
              console.error('데이터 조회 중 오류 발생:', err);
              return res.status(500).json({ message: '회원가입 성공, 그러나 데이터 조회 실패' });
            }
            res.json({ success: true, message: '회원가입 성공!', user: rows[0] });
          });
        });
      });
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
            // JWT 토큰 생성
            const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
            // 토큰을 응답에 포함
            return res.json({ success: true, message: '로그인 성공!', token, redirectUrl: '/index.html' });
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

        // 1. sns_id로 기존 유저 조회
        const selectQuery = 'SELECT * FROM users WHERE sns_id = ?';
        db.query(selectQuery, [sns_id], (err, rows) => {
            if (err) {
                console.error('DB 조회 중 오류 발생:', err);
                return res.redirect('/');
            }

            if (rows.length > 0) {
                // 이미 가입된 유저 → 로그인 처리(세션/토큰 등)
                // 예시: 세션에 user 정보 저장 (세션 미사용 시 생략)
                // req.session.user = rows[0];
                return res.redirect('/index.html');
            } else {
                // 신규 유저 → 회원가입
                const insertQuery = 'INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)';
                db.query(insertQuery, [sns_id, username, email], (err, result) => {
                    if (err) {
                        console.error('DB 삽입 중 오류 발생:', err);
                        return res.redirect('/');
                    }
                    const userId = result.insertId;

                    // user_levels, user_points, user_allergies에 기본값 삽입
                    const insertLevel = 'INSERT INTO user_levels (user_id, level) VALUES (?, 1)';
                    const insertPoint = 'INSERT INTO user_points (user_id, point) VALUES (?, 0)';
                    const insertAllergy = 'INSERT INTO user_allergies (user_id) VALUES (?)';

                    db.query(insertLevel, [userId], (err1) => {
                        if (err1) console.error('user_levels 입력 오류:', err1);
                        db.query(insertPoint, [userId], (err2) => {
                            if (err2) console.error('user_points 입력 오류:', err2);
                            db.query(insertAllergy, [userId], (err3) => {
                                if (err3) console.error('user_allergies 입력 오류:', err3);
                                res.redirect('/index.html');
                            });
                        });
                    });
                });
            }
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
        const sns_id = naverUser.id;
        const username = naverUser.name || naverUser.nickname;
        const email = naverUser.email;

        // 1. sns_id로 기존 유저 조회
        const selectQuery = 'SELECT * FROM users WHERE sns_id = ?';
        db.query(selectQuery, [sns_id], (err, rows) => {
            if (err) {
                console.error('DB 조회 중 오류:', err);
                return res.redirect('/');
            }

            if (rows.length > 0) {
                // 이미 가입된 유저 → 로그인 처리(세션/토큰 등) 후 리다이렉트
                console.log('이미 가입된 유저:', rows[0]);
                return res.redirect('/index.html');
            } else {
                // 신규 유저 → 회원가입
                const insertQuery = 'INSERT INTO users (sns_id, username, email) VALUES (?, ?, ?)';
                db.query(insertQuery, [sns_id, username, email], (err, result) => {
                    if (err) {
                        console.error('DB 삽입 중 오류:', err);
                        return res.redirect('/');
                    }
                    const userId = result.insertId;

                    // user_levels, user_points, user_allergies에 기본값 삽입
                    const insertLevel = 'INSERT INTO user_levels (user_id, level) VALUES (?, 1)';
                    const insertPoint = 'INSERT INTO user_points (user_id, point) VALUES (?, 0)';
                    const insertAllergy = 'INSERT INTO user_allergies (user_id) VALUES (?)';

                    db.query(insertLevel, [userId], (err1) => {
                        if (err1) console.error('user_levels 입력 오류:', err1);
                        db.query(insertPoint, [userId], (err2) => {
                            if (err2) console.error('user_points 입력 오류:', err2);
                            db.query(insertAllergy, [userId], (err3) => {
                                if (err3) console.error('user_allergies 입력 오류:', err3);
                                res.redirect('/index.html');
                            });
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('네이버 로그인 오류:', error.response?.data || error.message);
        res.status(500).send('네이버 로그인 실패');
    }
});

// JWT 인증 미들웨어 예시
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
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

// 게시글 등록 API (토큰 인증 예시)
app.post('/api/posts', authenticateToken, (req, res) => {
    const user_id = req.user.id; // 토큰에서 추출
    const { title, content } = req.body;
    if (!user_id || !title || !content) {
        return res.status(400).json({ success: false, message: '필수 항목이 누락되었습니다.' });
    }
    const query = 'INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)';
    db.query(query, [user_id, title, content], (err, result) => {
        if (err) {
            console.error('게시글 등록 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 오류' });
        }
        res.json({ success: true, postId: result.insertId });
    });
});

// 게시글 목록 조회 API
app.get('/api/posts', async (req, res) => {
    const query = `
        SELECT p.*, u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('게시글 조회 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 오류' });
        }
        res.json({ success: true, posts: results });
    });
});

// 게시글 수정 API
app.put('/api/posts/:id', authenticateToken, (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;
    const user_id = req.user.id; // 토큰에서 추출

    if (!title || !content) {
        return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }

    // 게시글 소유자 확인 쿼리
    const ownerQuery = 'SELECT * FROM posts WHERE id = ? AND user_id = ?';
    db.query(ownerQuery, [postId, user_id], (err, results) => {
        if (err) {
            console.error('게시글 소유자 확인 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 오류' });
        }

        if (results.length === 0) {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        // 게시글 수정 쿼리
        const updateQuery = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
        db.query(updateQuery, [title, content, postId], (err, result) => {
            if (err) {
                console.error('게시글 수정 오류:', err);
                return res.status(500).json({ success: false, message: 'DB 오류' });
            }
            res.json({ success: true, message: '게시글이 수정되었습니다.' });
        });
    });
});

// 게시글 삭제 API
app.delete('/api/posts/:id', authenticateToken, (req, res) => {
    const postId = req.params.id;
    const user_id = req.user.id; // 토큰에서 추출

    // 게시글 소유자 확인 쿼리
    const ownerQuery = 'SELECT * FROM posts WHERE id = ? AND user_id = ?';
    db.query(ownerQuery, [postId, user_id], (err, results) => {
        if (err) {
            console.error('게시글 소유자 확인 오류:', err);
            return res.status(500).json({ success: false, message: 'DB 오류' });
        }

        if (results.length === 0) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 게시글 삭제 쿼리
        const deleteQuery = 'DELETE FROM posts WHERE id = ?';
        db.query(deleteQuery, [postId], (err, result) => {
            if (err) {
                console.error('게시글 삭제 오류:', err);
                return res.status(500).json({ success: false, message: 'DB 오류' });
            }
            res.json({ success: true, message: '게시글이 삭제되었습니다.' });
        });
    });
});

// // 유저 정보 조회 API (user_id를 쿼리로 받는 예시)
// app.get('/api/user/:userId', (req, res) => {
//     const userId = req.params.userId;
//     const userQuery = `
//         SELECT 
//             username, 
//             level, 
//             (SELECT COUNT(*) FROM posts WHERE user_id = users.id) AS postCount,
//             point,
//             (SELECT COUNT(*) FROM followers WHERE followee_id = users.id) AS followerCount
//         FROM users
//         WHERE id = ?
//     `;
//     db.query(userQuery, [userId], (err, results) => {
//         if (err) return res.status(500).json({ success: false });
//         if (results.length === 0) return res.status(404).json({ success: false });
//         res.json({ success: true, user: results[0] });
//     });
// });

app.get('/api/user/me', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const userQuery = `
        SELECT 
            u.username,
            IFNULL(l.level, 1) AS level,
            (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS postCount,
            IFNULL(p.point, 0) AS point
        FROM users u
        LEFT JOIN user_levels l ON u.id = l.user_id
        LEFT JOIN user_points p ON u.id = p.user_id
        WHERE u.id = ?
    `;
    db.query(userQuery, [userId], (err, results) => {
        console.log('user/me 결과:', results); // ← 이 줄 추가!
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.status(404).json({ success: false });
        res.json({ success: true, user: results[0] });
    });
});

