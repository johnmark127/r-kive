import React, { useState, useEffect } from 'react';
import { loginUser, registerUser, resetPassword } from '../supabase/auth';
import Loading from './Loading';
import { useToast } from './ToastManager';
import TermsOfUseModal from './TermsOfUseModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';

const AuthModal = ({ isOpen, onClose }) => {
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
    const [showPassword, setShowPassword] = useState({});
    const [loading, setLoading] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const { showToast } = useToast();
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [registerData, setRegisterData] = useState({
        email: '',
        first_name: '',
        surname: '',
        password: '',
        confirm_password: ''
    });
    const [forgotPasswordData, setForgotPasswordData] = useState({
        email: ''
    });

    // Clear forms when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setLoginData({ email: '', password: '' });
            setRegisterData({ email: '', first_name: '', surname: '', password: '', confirm_password: '' });
            setForgotPasswordData({ email: '' });
            setShowPassword({});
            setIsRegisterMode(false);
            setIsForgotPasswordMode(false);
        }
    }, [isOpen]);

    // Handle escape key to close modal
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const result = await loginUser(loginData.email, loginData.password);
            
            if (result.success) {
                showToast(`Welcome back, ${result.user.displayName}!`, 'success');
                onClose();
                
                // Store user info in localStorage for demo purposes
                // In production, you might use React Context or state management
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.user.role === 'admin') {
                        window.location.href = '/admin';
                    } else if (result.user.role === 'superadmin') {
                        window.location.href = '/superadmin';
                    } else if (result.user.role === 'adviser') {
                        window.location.href = '/adviser';
                    } else {
                        window.location.href = '/student';
                    }
                }, 1000);
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('An unexpected error occurred during login', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Basic validation
        if (!registerData.first_name.trim() || !registerData.surname.trim()) {
            showToast('Please enter both first name and surname', 'error');
            setLoading(false);
            return;
        }

        if (registerData.password !== registerData.confirm_password) {
            showToast('Passwords do not match', 'error');
            setLoading(false);
            return;
        }

        if (registerData.password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            setLoading(false);
            return;
        }

        try {
            const result = await registerUser(
                registerData.email, 
                registerData.password, 
                registerData.first_name.trim(),
                registerData.surname.trim()
            );
            
            if (result.success) {
                showToast('Registration successful! Please check your email and verify your address before logging in.', 'info');
                setIsRegisterMode(false);
                setRegisterData({ email: '', first_name: '', surname: '', password: '', confirm_password: '' });
                setLoginData(prev => ({ ...prev, email: registerData.email }));
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showToast('An unexpected error occurred during registration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(forgotPasswordData.email)) {
            showToast('Please enter a valid email address', 'error');
            setLoading(false);
            return;
        }

        try {
            const result = await resetPassword(forgotPasswordData.email);
            
            if (result.success) {
                showToast(result.message, 'success');
                setIsForgotPasswordMode(false);
                setForgotPasswordData({ email: '' });
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            showToast('An unexpected error occurred while sending reset email', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            {loading && <Loading overlay={true} message="Processing..." />}
            <div className="modal-content">
                <span className="close-modal" onClick={onClose}>&times;</span>
                <div className={`modal-container ${isRegisterMode ? 'active' : ''} ${isForgotPasswordMode ? 'forgot-active' : ''}`}>
                    {/* Login Form */}
                    <div className="form-box login">
                        <form onSubmit={handleLoginSubmit}>
                            <h1>Login</h1>
                            <div className="input-box">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    value={loginData.email}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <i className='bx bxs-envelope'></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type={showPassword.loginPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    required
                                    value={loginData.password}
                                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <i className='bx bxs-lock-alt'></i>
                                <i 
                                    className={`bx ${showPassword.loginPassword ? 'bx-show-alt' : 'bx-hide'} toggle-password`}
                                    onClick={() => togglePasswordVisibility('loginPassword')}
                                    style={{ cursor: 'pointer', position: 'absolute', right: '45px', top: '50%', transform: 'translateY(-50%)' }}
                                ></i>
                            </div>
                            <div className="forgot-link">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsForgotPasswordMode(true);
                                }}>Forgot Password?</a>
                            </div>
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? (
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '24px',
                                        fontSize: '16px',
                                        fontWeight: 600
                                    }}>
                                        <span style={{ display: 'flex', alignItems: 'center' }}><Loading size="small" /></span>
                                        <span style={{ lineHeight: 1 }}>Logging in...</span>
                                    </span>
                                ) : (
                                    'Login'
                                )}
                            </button>
                            
                            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Terms of Use</a> and {' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Privacy Policy</a>.
                            </div>

                            {/* Mobile Signup Prompt */}
                            <div className="mobile-signup-prompt" style={{ textAlign: 'center', margin: '20px 0', display: 'none' }}>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Don't have an account?</p>
                                <button 
                                    type="button"
                                    onClick={() => setIsRegisterMode(true)}
                                    style={{
                                        background: 'none',
                                        border: '2px solid #667eea',
                                        color: '#667eea',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#667eea';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'none';
                                        e.target.style.color = '#667eea';
                                    }}
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Register Form */}
                    <div className="form-box register">
                        <form onSubmit={handleRegisterSubmit}>
                            <h1>Registration</h1>
                            <div className="input-box">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    required
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <i className='bx bxs-envelope'></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    name="first_name"
                                    placeholder="First Name"
                                    required
                                    value={registerData.first_name}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, first_name: e.target.value }))}
                                />
                                <i className='bx bxs-user'></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type="text"
                                    name="surname"
                                    placeholder="Surname"
                                    required
                                    value={registerData.surname}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, surname: e.target.value }))}
                                />
                                <i className='bx bxs-user-detail'></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type={showPassword.registerPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    required
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <i className='bx bxs-lock-alt'></i>
                                <i 
                                    className={`bx ${showPassword.registerPassword ? 'bx-show-alt' : 'bx-hide'} toggle-password`}
                                    onClick={() => togglePasswordVisibility('registerPassword')}
                                    style={{ cursor: 'pointer', position: 'absolute', right: '45px', top: '50%', transform: 'translateY(-50%)' }}
                                ></i>
                            </div>
                            <div className="input-box">
                                <input
                                    type={showPassword.confirmPassword ? "text" : "password"}
                                    name="confirm_password"
                                    placeholder="Confirm Password"
                                    required
                                    value={registerData.confirm_password}
                                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                />
                                <i className='bx bxs-lock-alt'></i>
                                <i 
                                    className={`bx ${showPassword.confirmPassword ? 'bx-show-alt' : 'bx-hide'} toggle-password`}
                                    onClick={() => togglePasswordVisibility('confirmPassword')}
                                    style={{ cursor: 'pointer', position: 'absolute', right: '45px', top: '50%', transform: 'translateY(-50%)' }}
                                ></i>
                            </div>
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Loading size="small" />
                                        Creating Account...
                                    </div>
                                ) : (
                                    'Register'
                                )}
                            </button>
                            
                            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Terms of Use</a> and {' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Privacy Policy</a>.
                            </div>

                            {/* Mobile Login Prompt */}
                            <div className="mobile-login-prompt" style={{ textAlign: 'center', margin: '20px 0', display: 'none' }}>
                                <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Already have an account?</p>
                                <button 
                                    type="button"
                                    onClick={() => setIsRegisterMode(false)}
                                    style={{
                                        background: 'none',
                                        border: '2px solid #667eea',
                                        color: '#667eea',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        e.target.style.background = '#667eea';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.background = 'none';
                                        e.target.style.color = '#667eea';
                                    }}
                                >
                                    Sign In
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Forgot Password Form */}
                    <div className={`form-box forgot-password ${isForgotPasswordMode ? 'active' : ''}`}>
                        <form onSubmit={handleForgotPasswordSubmit}>
                            <h1>Reset Password</h1>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                            <div className="input-box">
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    required
                                    value={forgotPasswordData.email}
                                    onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                                />
                                <i className='bx bxs-envelope'></i>
                            </div>
                            <button type="submit" className="btn" disabled={loading}>
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Loading size="small" />
                                        Sending Reset Link...
                                    </div>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                            <div className="back-to-login">
                                <a href="#" onClick={(e) => {
                                    e.preventDefault();
                                    setIsForgotPasswordMode(false);
                                }}>Back to Login</a>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '15px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Terms of Use</a> and {' '}
                                <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{ color: '#245884', textDecoration: 'underline', fontWeight: '500', cursor: 'pointer' }}>Privacy Policy</a>.
                            </div>
                        </form>
                    </div>

                    {/* Toggle Panels */}
                    <div className="toggle-box" style={{ display: isForgotPasswordMode ? 'none' : 'block' }}>
                        <div className="toggle-panel toggle-left">
                            <h1>Hello, Welcome!</h1>
                            <p style={{ color: 'white' }}>Don't have an account?</p>
                            <button 
                                className="btn modal-switch-register-btn" 
                                type="button"
                                onClick={() => setIsRegisterMode(true)}
                            >
                                Register
                            </button>
                        </div>
                        <div className="toggle-panel toggle-right">
                            <h1>Welcome Back!</h1>
                            <p style={{ color: 'white' }}>Already have an account?</p>
                            <button 
                                className="btn modal-switch-login-btn" 
                                type="button"
                                onClick={() => setIsRegisterMode(false)}
                            >
                                Login
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Legal Modals */}
            <TermsOfUseModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
            <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </div>
    );
};

export default AuthModal;
