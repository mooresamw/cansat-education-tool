'use client';

import React, { useState } from 'react';
import { FaFacebookF, FaLinkedinIn, FaGoogle } from 'react-icons/fa';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser } from 'react-icons/hi';

const LoginSignupPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    // Reset form fields when switching
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setShowPassword(false);
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log('Form submitted:', { email, password, firstName, lastName, isSignUp });
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
            
            <div className="flex justify-center space-x-4 mb-6">
              <button className="p-2 rounded-full border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <FaGoogle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <p className="text-center text-gray-500 mb-6">or use your email account</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <div className="flex justify-center space-x-4 mb-6">
              <button className="p-2 rounded-full border-2 border-gray-200 hover:border-blue-500 transition-colors">
                <FaGoogle className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <p className="text-center text-gray-500 mb-6">or use your email for registration</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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