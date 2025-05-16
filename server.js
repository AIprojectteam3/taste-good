const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
//bb4292da0b7c45bd1def3531c29efb21 rest api key
//0a67ccd23eeb991c84d7900835e98db7 js key
const KAKAO_REST_API_KEY = 'bb4292da0b7c45bd1def3531c29efb21';
const KAKAO_REDIRECT_URI = 'http://localhost:3000/kakao/callback';
const JWT_SECRET = 'YOUR_JWT_SECRET';

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
            console.log('로그인 성공:', user);

            // 로그인 성공 시 index.html로 리다이렉트
            res.redirect('/index.html');
        } else {
            res.json({ success: false, message: '로그인 실패: 이메일 또는 비밀번호가 잘못되었습니다.' });
        }
    });
});

// 카카오 콜백 처리

app.get('/kakao/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // 1. 인가 코드를 사용해 카카오 인증 서버에서 액세스 토큰 요청
    const tokenResponse = await axios.post('https://kauth.kakao.com/oauth/token', null, {
      params: {
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: KAKAO_REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. 액세스 토큰을 사용해 카카오 리소스 서버에서 사용자 정보 요청
    const userResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const kakaoUser = userResponse.data;
    const { id, properties, kakao_account } = kakaoUser;

    // 3. 사용자 정보 확인 및 회원가입/로그인 처리
    const query = 'SELECT * FROM users WHERE kakao_id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('데이터베이스 오류:', err);
        return res.status(500).json({ message: '서버 오류' });
      }

      if (results.length > 0) {
        // 기존 사용자: JWT 토큰 발급
        const token = jwt.sign({ id: results[0].id, username: results[0].username }, JWT_SECRET, {
          expiresIn: '1h',
        });
        res.json({ success: true, token });
      } else {
        // 신규 사용자: 회원가입 후 JWT 토큰 발급
        const insertQuery = 'INSERT INTO users (kakao_id, username, email) VALUES (?, ?, ?)';
        db.query(insertQuery, [id, properties.nickname, kakao_account.email], (err, result) => {
          if (err) {
            console.error('회원가입 중 오류 발생:', err);
            return res.status(500).json({ message: '회원가입 실패' });
          }

          const token = jwt.sign({ id: result.insertId, username: properties.nickname }, JWT_SECRET, {
            expiresIn: '1h',
          });
          res.json({ success: true, token });
        });
      }
    });
  } catch (error) {
    console.error('카카오 로그인 오류:', error);
    res.status(500).json({ message: '카카오 로그인 실패' });
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