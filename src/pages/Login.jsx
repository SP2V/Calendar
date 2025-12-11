import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = () => {
        // Mock Google Login - In real app, use Firebase Auth popup
        console.log("Logging in with Google...");
        navigate('/user');
    };

    const handleEmailLogin = (e) => {
        e.preventDefault();
        setError('');

        // Mock Email Login
        if (email === 'admin@spw.com' && password === 'admin') {
            navigate('/admin');
        } else if (email && password) {
            navigate('/user');
        } else {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h1>เข้าสู่ระบบ</h1>
                    <p>เข้าสู่ระบบเพื่อทำการจองกิจกรรมของคุณ</p>
                </div>

                {!showEmailForm ? (
                    <>
                        <button className="google-btn" onClick={handleGoogleLogin}>
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google G"
                                className="google-icon"
                            />
                            Sign in with Google
                        </button>

                        <div className="divider">หรือ</div>

                        <button
                            className="email-login-toggle-btn"
                            onClick={() => setShowEmailForm(true)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            เข้าสู่ระบบด้วยอีเมล
                        </button>
                    </>
                ) : (
                    <form className="login-form" onSubmit={handleEmailLogin}>
                        <div className="input-group">
                            <label>อีเมล</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input"
                            />
                        </div>

                        <div className="input-group">
                            <label>รหัสผ่าน</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                            />
                        </div>

                        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

                        <button type="submit" className="submit-btn">เข้าสู่ระบบ</button>
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => setShowEmailForm(false)}
                        >
                            ย้อนกลับ
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
