'use client';

import React, { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser } from 'react-icons/hi';
import { auth, db } from '@/lib/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
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
  const [rememberMe, setRememberMe] = useState();
  const [notification, setNotification] = useState('');
  const [selectedSchool, setSelectedSchool] = useState({
    school_name: '',
    school_id: '',
  });

  const router = useRouter();

  useEffect(() => {
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg flex overflow-hidden relative">
        <div className={`w-full flex transition-transform duration-500 ease-in-out ${isSignUp ? '-translate-x-1/2' : 'translate-x-0'}`}>
          <div className="w-full md:w-1/2 p-8 flex-shrink-0">
            <div className="mb-8">
              <h1 className="text-blue-500 text-xl font-medium">EduPlatform</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Sign in to EduPlatform</h2>
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
                <a href="#" className="text-sm text-gray-600 hover:text-blue-500">Forgot Password?</a>
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
              <h1 className="text-blue-500 text-xl font-medium">EduPlatform</h1>
            </div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Account</h2>
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
                <h2 className="text-3xl font-bold mb-4">Welcome to EduPlatform</h2>
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
    </div>
  );
};

export default LoginSignupPage;