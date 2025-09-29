const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

// MySQL 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'ai3',
});

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


class User {
    /**
     * 새로운 사용자를 생성하는 메서드 (회원가입)
     */
    static async createUser(userData) {
        const { username, email, password, passwordConfirm, address, detailAddress } = userData;
        try {
            // 유효성 검사
            const usernameValidation = validateUsername(username);
            if (!usernameValidation.valid) {
                return { success: false, statusCode: 400, message: usernameValidation.message };
            }
            if (!email || !validateEmail(email)) {
                return { success: false, statusCode: 400, message: '올바른 이메일 형식을 입력해주세요.' };
            }
            if (!password || !validatePassword(password)) {
                return { success: false, statusCode: 400, message: '비밀번호는 8-20자리이며, 영문자와 숫자가 모두 포함되어야 합니다.' };
            }
            if (password !== passwordConfirm) {
                return { success: false, statusCode: 400, message: '비밀번호와 비밀번호 확인이 일치하지 않습니다.' };
            }

            // 중복 확인
            const [usernameExists, emailExists] = await Promise.all([
                new Promise((resolve) => db.query('SELECT id FROM users WHERE username = ?', [username.trim()], (err, res) => resolve(res.length > 0))),
                new Promise((resolve) => db.query('SELECT id FROM users WHERE email = ?', [email], (err, res) => resolve(res.length > 0)))
            ]);
            if (usernameExists) {
                return { success: false, statusCode: 409, message: '이미 사용 중인 닉네임입니다.' };
            }
            if (emailExists) {
                return { success: false, statusCode: 409, message: '이미 사용 중인 이메일입니다.' };
            }

            // 비밀번호 해시화 및 DB 저장
            const hashedPassword = await bcrypt.hash(password, 10);
            const insertResult = await new Promise((resolve, reject) => {
                const sql = 'INSERT INTO users (username, email, password, address, detail_address) VALUES (?, ?, ?, ?, ?)';
                db.query(sql, [username, email, hashedPassword, address, detailAddress], (err, res) => err ? reject(err) : resolve(res));
            });
            const newUser = await new Promise((resolve, reject) => {
                db.query('SELECT id, username, email FROM users WHERE id = ?', [insertResult.insertId], (err, res) => err ? reject(err) : resolve(res[0]));
            });
            return { success: true, user: newUser };
        } catch (error) {
            console.error('회원가입 처리 중 오류:', error);
            return { success: false, statusCode: 500, message: '서버 내부 오류가 발생했습니다.' };
        }
    }

    /**
     * 이메일로 사용자를 찾는 메서드
     */
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
                if (err) return reject(err);
                resolve(results[0] || null);
            });
        });
    }

    static async findById(id) {
        return new Promise((resolve, reject) => {
            // 비밀번호를 제외한 사용자 정보를 조회합니다.
            const sql = 'SELECT id, username, email, address, detail_address, profile_intro, profile_image_path FROM users WHERE id = ?';
            db.query(sql, [id], (err, results) => {
                if (err) {
                    return reject(err);
                }
                resolve(results[0] || null);
            });
        });
    }

    /**
     * 비밀번호를 비교하는 메서드
     */
    static async comparePasswords(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = { User };