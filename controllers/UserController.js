const { User } = require('../models/User');
const jwt = require('jsonwebtoken');

class UserController {
    // 회원가입 처리
    async signup(req, res) {
        try {
            const result = await User.createUser(req.body);
            if (!result.success) {
                return res.status(result.statusCode || 400).json({ message: result.message });
            }
            res.status(201).json({ success: true, message: '회원가입 성공!', user: result.user });
        } catch (error) {
            res.status(500).json({ message: '회원가입 처리 중 서버 오류가 발생했습니다.' });
        }
    }

    // 로그인 처리
    async login(req, res) {
        const { email, password } = req.body;
        try {
            // 모델을 통해 사용자 조회
            const user = await User.findByEmail(email);
            if (!user) {
                return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });
            }

            // 모델을 통해 비밀번호 비교
            const isMatch = await User.comparePasswords(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
            }

            // JWT 토큰 생성 (보안을 위해 비밀번호는 제외)
            const payload = { userId: user.id, username: user.username };
            const token = jwt.sign(payload, 'YOUR_JWT_SECRET', { expiresIn: '1h' });

            res.json({
                success: true,
                message: '로그인 성공!',
                token,
                user: { id: user.id, username: user.username, email: user.email }
            });
        } catch (error) {
            res.status(500).json({ message: '로그인 처리 중 서버 오류가 발생했습니다.' });
        }
    }

    async getUserProfile(req, res) {
        // authenticateToken 미들웨어가 검증 후 req.user에 넣어준 사용자 ID를 사용합니다.
        try {
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
            }

            // 비밀번호 등 민감한 정보는 제외하고 필요한 정보만 클라이언트에 전송
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                address: user.address,
                detail_address: user.detail_address,
                profile_intro: user.profile_intro,
                profile_image_path: user.profile_image_path
                // 필요한 다른 사용자 정보 추가
            });
        } catch (error) {
            console.error('사용자 프로필 조회 오류:', error);
            res.status(500).json({ message: '사용자 정보를 가져오는 중 서버 오류가 발생했습니다.' });
        }
    }
}

module.exports = new UserController();