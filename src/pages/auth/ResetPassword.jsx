import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import { useToast } from '../../components/ToastManager';
import Loading from '../../components/Loading';
import '../../components/AuthModal.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        // Check if user is in password reset mode
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsValidSession(true);
            } else {
                showToast('Invalid or expired reset link', 'error');
                setTimeout(() => navigate('/'), 3000);
            }
        };
        checkSession();
    }, [navigate, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (password.length < 6) {
            showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                showToast(error.message || 'Failed to reset password', 'error');
            } else {
                showToast('Password successfully reset! Redirecting to login...', 'success');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showToast('An unexpected error occurred', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isValidSession) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <Loading message="Verifying reset link..." />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div className="modal-content" style={{
                position: 'relative',
                maxWidth: '450px',
                width: '100%',
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                padding: '40px'
            }}>
                {loading && <Loading overlay={true} message="Resetting password..." />}
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔐</div>
                    <h1 style={{ fontSize: '32px', color: '#333', marginBottom: '10px' }}>
                        Reset Your Password
                    </h1>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                        Enter your new password below
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-box" style={{ marginBottom: '20px', position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="New Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '15px 45px 15px 45px',
                                fontSize: '16px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.3s',
                                boxSizing: 'border-box'
                            }}
                        />
                        <i className='bx bxs-lock-alt' style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '20px',
                            color: '#999'
                        }}></i>
                        <i 
                            className={`bx ${showPassword ? 'bx-show-alt' : 'bx-hide'}`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                cursor: 'pointer',
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '20px',
                                color: '#999'
                            }}
                        ></i>
                    </div>

                    <div className="input-box" style={{ marginBottom: '30px', position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm New Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '15px 45px 15px 45px',
                                fontSize: '16px',
                                border: '2px solid #e0e0e0',
                                borderRadius: '10px',
                                outline: 'none',
                                transition: 'border-color 0.3s',
                                boxSizing: 'border-box'
                            }}
                        />
                        <i className='bx bxs-lock-alt' style={{
                            position: 'absolute',
                            left: '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '20px',
                            color: '#999'
                        }}></i>
                        <i 
                            className={`bx ${showConfirmPassword ? 'bx-show-alt' : 'bx-hide'}`}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                cursor: 'pointer',
                                position: 'absolute',
                                right: '15px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '20px',
                                color: '#999'
                            }}
                        ></i>
                    </div>

                    <button 
                        type="submit" 
                        className="btn" 
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '15px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Loading size="small" />
                                Resetting Password...
                            </div>
                        ) : (
                            'Reset Password'
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <a 
                            href="/" 
                            style={{ 
                                color: '#667eea', 
                                textDecoration: 'none',
                                fontSize: '14px',
                                fontWeight: '500'
                            }}
                        >
                            Back to Login
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
