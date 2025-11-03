import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import AuthLayout from './AuthLayout';
import NotificationToast from './NotificationToast';
import { useNotification } from '../hooks/useNotification';

const ResetPassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { notification, showError, showSuccess, hideNotification } = useNotification();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Validate token on component mount
    if (!token) {
      setIsValidToken(false);
      showError('Invalid Link', 'The reset password link is invalid or malformed.');
    } else {
      setIsValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showError('Invalid Token', 'Reset password token is missing.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showError('Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }

    if (formData.password.length < 6) {
      showError('Password Too Short', 'Password must be at least 6 characters long.');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      showError('Weak Password', 'Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiService.resetPassword(token, formData.password);
      
      if (result.success) {
        showSuccess('Password Reset Successful!', 'Your password has been reset successfully. You can now sign in with your new password.');
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        showError('Reset Failed', result.message);
      }
    } catch (error) {
      showError('Connection Error', 'Unable to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  function ResetPasswordLeftContent() {
    return (
      <div className="relative w-full h-full hidden lg:flex flex-col justify-center p-20 text-white">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/drnak5yb2/image/upload/v1754555854/MPFM-SFS-3G-X-1536x1187_qhmxbs.png')`,
          }}
        ></div>

        {/* Logo fixed top-left */}
        <div className="absolute top-6 left-6 z-20">
          <img
            src="https://res.cloudinary.com/drnak5yb2/image/upload/v1756278804/light_mode_logo_saher_btbdos.svg"
            alt="Saher Flow Solutions"
            className="h-12"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-20 text-white max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 leading-snug">
            Secure Password Reset for
            <br />
            Saher Flow Solutions
            <span className="block text-4xl font-medium mt-2 text-yellow-400">
              Professional Portal
            </span>
          </h1>
          <p className="text-xl text-gray-200 leading-relaxed">
            Create a new secure password for your professional monitoring
            dashboard. Your account security is our top priority.
          </p>
          <div className="space-y-6 mt-10">
            {[
              'Secure password requirements enforced',
              'Immediate access after reset',
              'Enhanced account protection',
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-gray-200 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <NotificationToast
          type={notification.type}
          title={notification.title}
          message={notification.message}
          isVisible={notification.isVisible}
          onClose={hideNotification}
        />
        <div className="min-h-screen flex">
          {/* Left Side - Branded */}
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700">
            <div className="absolute inset-0 bg-black/30"></div>
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{
                backgroundImage: `url('https://res.cloudinary.com/drnak5yb2/image/upload/v1754555854/MPFM-SFS-3G-X-1536x1187_qhmxbs.png')`,
              }}
            ></div>

            <div className="absolute top-6 left-6 z-20">
              <img
                src="https://res.cloudinary.com/drnak5yb2/image/upload/v1756278804/light_mode_logo_saher_btbdos.svg"
                alt="Saher Flow Solutions"
                className="h-12"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-center p-12 text-white">
              <div className="mb-8">
                <h1 className="text-5xl font-bold mb-6 leading-snug">
                  Invalid Reset Link
                  <span className="block text-yellow-400">Please Try Again</span>
                </h1>
                <p className="text-xl text-gray-200 leading-relaxed my-4">
                  The password reset link you used is invalid or has expired.
                  Please request a new password reset link.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Error Message */}
          <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
            <div className="mx-auto w-full max-w-md text-center">
              <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-8 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>

              <h2 className="text-4xl font-bold text-navy-900 mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-gray-600 mb-8">
                This password reset link is invalid or has expired. Please request a new one.
              </p>

              <div className="space-y-4">
                <Link
                  to="/forgot-password"
                  className="block w-full bg-navy-600 hover:bg-navy-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Request New Reset Link
                </Link>

                <Link
                  to="/login"
                  className="block w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NotificationToast
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <AuthLayout leftContent={<ResetPasswordLeftContent />}>
          <div className="md:w-[80%] w-[90%] mx-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full md:p-10 p-6 my-8">
              <div className="mb-8">
                <h2 className="md:text-4xl text-3xl font-bold text-navy-900 mb-2">
                  Reset your password
                </h2>
                <p className="text-gray-600">
                  Enter your new password below
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-500 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-200 transition-colors"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-500 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-200 transition-colors"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• At least 6 characters long</li>
                    <li>• Contains at least one uppercase letter</li>
                    <li>• Contains at least one lowercase letter</li>
                    <li>• Contains at least one number</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting password...' : 'Reset password'}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="font-medium text-navy-600 hover:text-navy-500"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

      </AuthLayout>
    </>
  );
};

export default ResetPassword;
