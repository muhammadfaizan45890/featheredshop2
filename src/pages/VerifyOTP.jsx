import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, RotateCcw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import API from '@/utils/api';

const VerifyOTP = () => {
  const { email } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    setSuccessMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5 && newOtp.every((digit) => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpValue = otp.join('')) => {
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${API}/user/verify-otp/${email}`, {
        otp: otpValue,
      });
      setSuccessMessage(res.data.message || 'OTP verified successfully!');
      toast.success('OTP verified! Redirecting...');
      setTimeout(() => {
        navigate(`/change-password/${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(message);
      toast.error(message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    try {
      setIsResending(true);
      const res = await axios.post(`${API}/user/resend-otp`, { email });
      if (res.data.success) {
        toast.success(res.data.message || 'New OTP sent to your email');
        setResendCooldown(60);
        setError('');
        setSuccessMessage('');
      } else {
        setError(res.data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const clearOtp = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setSuccessMessage('');
    inputRefs.current[0]?.focus();
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-black">
      {/* Static background blobs – gray tones */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gray-200/50 dark:bg-gray-800/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gray-200/50 dark:bg-gray-800/30 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white sm:text-4xl">
              Verify your email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a 6‑digit verification code to{' '}
              <span className="font-medium text-black dark:text-white">
                {email ? decodeURIComponent(email) : 'your email'}
              </span>
            </p>
          </div>

          <Card className="w-full border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center text-black dark:text-white">
                Enter verification code
              </CardTitle>
              <CardDescription className="text-center text-gray-500 dark:text-gray-400">
                Enter the 6‑digit code sent to your email
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <AlertDescription className="text-red-700 dark:text-red-400">{error}</AlertDescription>
                </Alert>
              )}
              {successMessage && (
                <Alert className="border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                  <AlertDescription className="text-gray-800 dark:text-gray-200">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              {successMessage && successMessage.includes('verified') ? (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
                    <CheckCircle className="h-6 w-6 text-black dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg text-black dark:text-white">
                      Verification successful
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Your email has been verified. You'll be redirected to reset your password.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-black dark:text-white" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Redirecting...</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* OTP Input Group */}
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        maxLength={1}
                        ref={(el) => (inputRefs.current[index] = el)}
                        className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl font-bold border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-black/20 dark:focus:ring-white/20"
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleVerify()}
                      disabled={isLoading || !isOtpComplete}
                      className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify code'
                      )}
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={clearOtp}
                        disabled={isLoading}
                        className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleResendOtp}
                        disabled={isResending || resendCooldown > 0}
                        className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {isResending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex justify-center pt-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Wrong email?{' '}
                <Link
                  to="/forgot-password"
                  className="text-black dark:text-white hover:underline font-medium"
                >
                  Go back
                </Link>
              </p>
            </CardFooter>
          </Card>

          {/* Testing hint – subtle gray */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              For testing, use code: <span className="font-mono font-medium text-black dark:text-white">123456</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;