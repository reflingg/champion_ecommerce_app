import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/api';

const ForgotPassword = ({ showToast }) => {
    const [step, setStep] = useState(1); // 1: enter email, 2: enter new password
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [userName, setUserName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await forgotPassword({ email });
            setResetToken(data.resetToken);
            setUserName(data.name);
            setStep(2);
            showToast('Email verified!', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to verify email');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const { data } = await resetPassword({ resetToken, newPassword });
            setSuccess(data.message);
            setStep(3);
            showToast('Password reset successfully!', 'success');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {step === 1 && (
                    <>
                        <h1>Forgot Password</h1>
                        <p className="subtitle">Enter your email to reset your password</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleEmailSubmit}>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>

                        <p className="auth-footer">
                            Remember your password? <Link to="/login">Sign in</Link>
                        </p>
                    </>
                )}

                {step === 2 && (
                    <>
                        <h1>Reset Password</h1>
                        <p className="subtitle">Hi {userName}, enter your new password</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleResetSubmit}>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your new password"
                                    required
                                    minLength={6}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                )}

                {step === 3 && (
                    <>
                        <h1>Password Reset!</h1>
                        <div className="success-message" style={{ textAlign: 'center', marginBottom: '20px' }}>
                            {success}
                        </div>
                        <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center' }}>
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
