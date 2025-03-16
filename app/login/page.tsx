'use client';

import React, { useEffect, useState } from 'react';
import { FaGoogle } from 'react-icons/fa';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser } from 'react-icons/hi';
import { auth, db } from '@/lib/firebaseConfig'; // Import Firebase config
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import HighSchoolSearch from "@/components/HighSchoolSearch";

const LoginSignupPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState();
  const [rememberMe, setRememberMe] = useState();
  const [notification, setNotification] = useState(''); // New state for notification
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
    // Reset form fields when switching
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setSelectedSchool({})
    setShowPassword(false);
    setNotification(''); // Clear notification when toggling forms
  };


  const handleSchoolSelect = (name: string,  placeId: any) => {
    setSelectedSchool({
      school_name: name,
      school_id: placeId,
    });
    console.log("Selected School:", name, "Place ID:", placeId);
  };

  // Handle user sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send user data to Flask server
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

      // Show success notification instead of redirecting
      setNotification("Account created successfully. Please use sign-in button below to continue.");

      // Clear form fields
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');

    } catch (error: any) {
      console.error("Error signing up:", error.message);
      setNotification("Error creating account. Please try again."); // Show error notification
    }
  };

  // Handle user login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Fetch user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('User logged in successfully!');
        // Redirect to dashboard
        router.push(`/dashboard/${userData.role}`);
      } else {
        console.error('User not found in Firestore');
      }
    } catch (error: any) {
      console.error('Error logging in:', error.message);
      setNotification("Error logging in. Please check your credentials."); // Show error notification
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg flex overflow-hidden relative">
        {/* Form Container */}
        <div className={`w-full flex transition-transform duration-500 ease-in-out ${isSignUp ? '-translate-x-1/2' : 'translate-x-0'}`}>
          {/* Sign In Form */}
          <div className="w-full md:w-1/2 p-8 flex-shrink-0">
            <div className="mb-8">
              <h1 className="text-blue-500 text-xl font-medium">EduPlatform</h1>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Sign in to EduPlatform</h2>


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

          {/* Sign Up Form */}
          <div className="w-full md:w-1/2 p-8 flex-shrink-0">
            <div className="mb-8">
              <h1 className="text-blue-500 text-xl font-medium">EduPlatform</h1>
            </div>

            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Create Account</h2>
            {/* Notification for signup */}
            {notification && isSignUp && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                {notification}
              </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-6">
              {/* First Name */}
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

              {/* Last Name */}
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

              {/* Email */}
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

              {/* Password */}
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

              {/*search for student school*/}
              <HighSchoolSearch onSelect={handleSchoolSelect} Style={'SignUp'}></HighSchoolSearch>

              {/* Sign Up Button */}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Sign Up
              </button>
            </form>

            {/* Already have an account? Sign In */}
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

        {/* Sliding Overlay */}
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