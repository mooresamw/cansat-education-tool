'use client';

import React, { useEffect, useState } from 'react';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser } from 'react-icons/hi';
import { auth, db } from '@/lib/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import HighSchoolSearch from "@/components/HighSchoolSearch";

const LoginSignupPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState();
  const [rememberMe, setRememberMe] = useState(false); // Fixed: Removed duplicate
  const [notification, setNotification] = useState(''); // Fixed: Removed duplicate
  const [selectedSchool, setSelectedSchool] = useState({
    school_name: '',
    school_id: '',
  });
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false); // Forgot password modal state
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState(''); // Email for password reset

  const router = useRouter();

  useEffect(() => {
    // Retrieve saved email and password from localStorage if "Remember Me" was checked
    const savedEmail = localStorage.getItem('rememberMeEmail');
    const savedPassword = localStorage.getItem('rememberMePassword');
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }

    // Retrieve user data from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (storedUser) setUser(storedUser);
  }, []);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setSelectedSchool({ school_name: '', school_id: '' });
    setShowPassword(false);
    setNotification('');
  };

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({
      school_name: name,
      school_id: placeId,
    });
    console.log("Selected School:", name, "Place ID:", placeId);
  };

  // Validate password against requirements
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    return { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar };
  };

  const passwordValidation = validatePassword(password);

  // Handle user sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (!Object.values(passwordValidation).every((val) => val)) {
      setNotification("Password does not meet the requirements.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Use the standalone sendEmailVerification function
      await sendEmailVerification(user); // Pass the user object as an argument
      console.log("Verification email sent to:", email);
  
      const response = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          email,
          name: `${firstName} ${lastName}`,
          role,
          school_name: selectedSchool.school_name,
          school_id: selectedSchool.school_id,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to register user");
  
      const data = await response.json();
      console.log("User registered successfully:", data);
  
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
  
      setNotification("Account created successfully. Please check your email to verify your account.");
  
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setSelectedSchool({ school_name: '', school_id: '' });
  
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      setNotification(`Error: ${error.message}. Please try again.`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Optional: Enforce email verification (uncomment if desired)
      
      if (!user.emailVerified) {
        setNotification("Please verify your email before logging in.");
        await signOut(auth);
        return;
      }
      

      // Save email and password to localStorage if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem('rememberMeEmail', email);
        localStorage.setItem('rememberMePassword', password);
      } else {
        // Clear saved email and password if "Remember Me" is unchecked
        localStorage.removeItem('rememberMeEmail');
        localStorage.removeItem('rememberMePassword');
      }

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('User logged in successfully!');
        router.push(`/dashboard/${userData.role}`);
      } else {
        console.error('User not found in Firestore');
        setNotification("User data not found. Please contact support.");
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      setNotification("Error logging in. Please check your credentials.");
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setNotification("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, forgotPasswordEmail);
      setNotification("Password reset email sent. Please check your inbox.");
      setIsForgotPasswordModalOpen(false); // Close the modal
    } catch (error: any) {
      console.error("Error sending password reset email:", error.message);
      setNotification("Error sending password reset email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg flex overflow-hidden relative">
        <div className={`w-full flex transition-transform duration-500 ease-in-out ${isSignUp ? '-translate-x-1/2' : 'translate-x-0'}`}>
          <div className="w-full md:w-1/2 p-8 flex-shrink-0">
            <div className="mb-8">
              <h1 className="text-blue-500 text-xl font-medium">CanSat</h1>
            </div>
            
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Sign in to CanSat</h2>

            {/* Notification for login */}
            {notification && !isSignUp && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {notification}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
              </div>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordModalOpen(true)}
                  className="text-sm text-gray-600 hover:text-blue-500"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
          <div className="w-full md:w-1/2 p-8 flex-shrink-0">
            <div className="mb-8">
              <h1 className="text-blue-500 text-xl font-medium">CanSat</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Account</h2>
            
            {/* Notification for signup */}
            {notification && isSignUp && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {notification}
              </div>
            )}
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
              </div>
              <div className="relative">
                <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
              </div>
              <div className="relative">
                <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
              </div>
              <div className="relative">
                <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                </button>
              </div>
              <HighSchoolSearch onSelect={handleSchoolSelect} Style={'SignUp'}></HighSchoolSearch>
              <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                <p className={passwordValidation.minLength ? "text-blue-500" : "text-gray-500"}>
                  • At least 8 characters
                </p>
                <p className={passwordValidation.hasUppercase ? "text-blue-500" : "text-gray-500"}>
                  • At least one uppercase letter
                </p>
                <p className={passwordValidation.hasLowercase ? "text-blue-500" : "text-gray-500"}>
                  • At least one lowercase letter
                </p>
                <p className={passwordValidation.hasNumber ? "text-blue-500" : "text-gray-500"}>
                  • At least one number
                </p>
                <p className={passwordValidation.hasSpecialChar ? "text-blue-500" : "text-gray-500"}>
                  • At least one special character
                </p>
              </div>
              
              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Sign Up
              </button>
            </form>
            <div className="mt-4 text-center">
              <span
                onClick={toggleForm}
                className="text-sm text-gray-600 hover:text-black-500 cursor-pointer"
              >
                Already have an account? <span className="font-semibold">Sign In</span>
              </span>
            </div>
          </div>
        </div>
        <div
          className={`hidden md:flex absolute top-0 right-0 w-1/2 h-full transition-transform duration-500 ease-in-out ${
            isSignUp ? 'translate-x-full' : 'translate-x-0'
          } bg-blue-500`}
        >
          <div className="h-full w-full flex flex-col justify-center items-center text-center p-12 text-white">
            {!isSignUp ? (
              <>
                <h2 className="text-3xl font-bold mb-4">Welcome to CanSat</h2>
                <p className="mb-8">Fill up personal information and start your journey with us.</p>
                <button
                  onClick={toggleForm}
                  className="border-2 border-white text-white py-2 px-8 rounded-full hover:bg-white hover:text-blue-500 transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                <p className="mb-8">To keep connected with us, please log in with your personal info.</p>
                <button
                  onClick={toggleForm}
                  className="border-2 border-white text-white py-2 px-8 rounded-full hover:bg-white hover:text-blue-500 transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
            <p className="text-gray-600 mb-4">Enter your email address to reset your password.</p>
            <input
              type="email"
              placeholder="Email"
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 border border-gray-200"
            />
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setIsForgotPasswordModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSignupPage;