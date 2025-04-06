"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiUser } from "react-icons/hi";
import { auth, db } from "@/lib/firebaseConfig";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import HighSchoolSearch from "@/components/HighSchoolSearch";
import { FaCheckCircle, FaCircle } from "react-icons/fa";

const LoginSignupPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [notification, setNotification] = useState("");
  const [selectedSchool, setSelectedSchool] = useState({
    school_name: "",
    school_id: "",
  });
  const [errors, setErrors] = useState<any>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    special: false,
    number: false,
  });
  const [isForgotPassword, setIsForgotPassword] = useState(false); // New state for forgot password
  const [resetEmail, setResetEmail] = useState(""); // Email for password reset

  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) setUser(storedUser);

    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedEmail && savedPassword && savedRememberMe) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setShowPasswordRequirements(true);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const length = password.length >= 8;
    const uppercase = /[A-Z]/.test(password);
    const lowercase = /[a-z]/.test(password);
    const special = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const number = /[0-9]/.test(password);

    setPasswordCriteria({
      length,
      uppercase,
      lowercase,
      special,
      number,
    });

    if (password) {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  }, [password]);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setSelectedSchool({ school_name: "", school_id: "" });
    setShowPassword(false);
    setNotification("");
    setErrors({});
    setShowPasswordRequirements(false);
    setIsForgotPassword(false); // Reset forgot password state
  };

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({
      school_name: name,
      school_id: placeId,
    });
    setErrors((prev) => ({ ...prev, school: "" }));
    console.log("Selected School:", name, "Place ID:", placeId);
  };

  const validateForm = () => {
    const newErrors: any = {};

    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password.trim()) newErrors.password = "Password is required";
    if (!selectedSchool.school_name) newErrors.school = "Please select a high school";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification("Please fill out all required fields");
      return;
    }

    const allCriteriaMet = Object.values(passwordCriteria).every((criteria) => criteria === true);
    if (!allCriteriaMet) {
      setNotification("Password must meet all requirements");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
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

      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
        localStorage.setItem("savedPassword", password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("savedEmail");
        localStorage.removeItem("savedPassword");
        localStorage.setItem("rememberMe", "false");
      }

      setNotification("Account created successfully. Please check your email to verify your account.");

      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setSelectedSchool({ school_name: "", school_id: "" });
      setErrors({});
      setShowPasswordRequirements(false);
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

      if (!user.emailVerified) {
        setNotification("Please verify your email before logging in.");
        await signOut(auth);
        return;
      }

      const idToken = await user.getIdToken();

      const loginResponse = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!loginResponse.ok) {
        const errorText = await loginResponse.text();
        console.error("Backend login failed:", errorText);
        setNotification("Login succeeded, but backend notification failed. Contact support.");
      } else {
        const loginData = await loginResponse.json();
        console.log("Backend login successful:", loginData);
      }

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.verified !== user.emailVerified) {
          console.log("Updating verified field in Firestore to:", user.emailVerified);
          await updateDoc(userRef, {
            verified: user.emailVerified,
          });
          console.log("Verified field updated successfully");
        }

        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
          localStorage.setItem("savedPassword", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
          localStorage.setItem("rememberMe", "false");
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        console.log("User logged in successfully!");
        router.push(`/dashboard/${userData.role}`);
      } else {
        console.error("User not found in Firestore");
        setNotification("User data not found. Please contact support.");
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      setNotification("Error logging in. Please check your credentials.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setNotification("Please enter your email address.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setNotification("Password reset email sent. Please check your inbox.");
      setResetEmail("");
      setIsForgotPassword(false); // Return to login form after sending
    } catch (error: any) {
      console.error("Error sending password reset email:", error.message);
      setNotification(`Error: ${error.message}. Please try again.`);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-4xl bg-black border border-gray-800 rounded-sm shadow-lg flex overflow-hidden relative">
          <div
            className={`w-full flex transition-transform duration-500 ease-in-out ${
              isSignUp ? "-translate-x-1/2" : "translate-x-0"
            }`}
          >
            {/* Sign In Form */}
            <div className="w-full md:w-1/2 p-8 flex-shrink-0">
              <div className="mb-8">
                <Link href="/">
                  <h1 className="text-white text-xl font-medium">CanSat</h1>
                </Link>
              </div>
              {!isForgotPassword ? (
                <>
                  <h2 className="text-2xl font-semibold mb-6 text-white">Sign in</h2>
                  {notification && !isSignUp && (
                    <div className="mb-4 p-3 bg-gray-900 text-white border border-gray-700 text-sm">
                      {notification}
                    </div>
                  )}
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="relative">
                      <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                      />
                    </div>
                    <div className="relative">
                      <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
                          className="rounded-sm border-gray-700 bg-gray-900 text-white focus:ring-0"
                        />
                        <span className="ml-2 text-sm text-gray-400">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(true)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-black py-2 px-4 rounded-sm hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                    >
                      Sign In
                    </button>
                    <div className="md:hidden mt-4 text-center">
                      <span onClick={toggleForm} className="text-sm text-gray-400 hover:text-white cursor-pointer">
                        Don't have an account? <span className="font-semibold">Sign Up</span>
                      </span>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-6 text-white">Reset Password</h2>
                  {notification && (
                    <div className="mb-4 p-3 bg-gray-900 text-white border border-gray-700 text-sm">
                      {notification}
                    </div>
                  )}
                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="relative">
                      <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-black py-2 px-4 rounded-sm hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                    >
                      Send Reset Link
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Sign Up Form */}
            <div className="w-full md:w-1/2 p-8 flex-shrink-0">
              <div className="mb-8">
                <Link href="/">
                  <h1 className="text-white text-xl font-medium">CanSat</h1>
                </Link>
              </div>
              <h2 className="text-2xl font-semibold mb-6 text-white">Create Account</h2>
              {notification && isSignUp && (
                <div className="mb-4 p-3 bg-gray-900 text-white border border-gray-700 text-sm">
                  {notification}
                </div>
              )}
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div className="relative">
                  <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 focus:ring-white text-white placeholder-gray-500 border border-gray-800"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    required
                    className={`w-full pl-10 pr-12 py-2 bg-gray-900 rounded-sm focus:outline-none focus:ring-1 text-white placeholder-gray-500 border ${
                      errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-800 focus:ring-white"
                    } border-2`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                  </button>
                  {showPasswordRequirements && (
                    <div className="absolute z-10 mt-2 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-sm text-gray-200 w-[280px] animate-fadeIn">
                      <p className="font-semibold text-white mb-3">Create a Strong Password</p>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          {passwordCriteria.length ? (
                            <FaCheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaCircle className="mt-0.5 mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={passwordCriteria.length ? "text-green-400" : "text-gray-400"}>
                            At least 8 characters
                          </span>
                        </li>
                        <li className="flex items-start">
                          {passwordCriteria.uppercase ? (
                            <FaCheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaCircle className="mt-0.5 mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={passwordCriteria.uppercase ? "text-green-400" : "text-gray-400"}>
                            One uppercase letter
                          </span>
                        </li>
                        <li className="flex items-start">
                          {passwordCriteria.lowercase ? (
                            <FaCheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaCircle className="mt-0.5 mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={passwordCriteria.lowercase ? "text-green-400" : "text-gray-400"}>
                            One lowercase letter
                          </span>
                        </li>
                        <li className="flex item s-start">
                          {passwordCriteria.special ? (
                            <FaCheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaCircle className="mt-0.5 mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={passwordCriteria.special ? "text-green-400" : "text-gray-400"}>
                            One special character (!@#$)
                          </span>
                        </li>
                        <li className="flex items-start">
                          {passwordCriteria.number ? (
                            <FaCheckCircle className="mt-0.5 mr-2 h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <FaCircle className="mt-0.5 mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={passwordCriteria.number ? "text-green-400" : "text-gray-400"}>
                            One number (0-9)
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <div>
                  <HighSchoolSearch onSelect={handleSchoolSelect} Style={"SignUp"} />
                  {selectedSchool.school_name ? (
                    <p className="text-gray-400 text-sm mt-1">Selected: {selectedSchool.school_name}</p>
                  ) : (
                    <p className="text-gray-400 text-sm mt-1">High School * (required)</p>
                  )}
                  {errors.school && <p className="text-red-500 text-xs mt-1">{errors.school}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black py-2 px-4 rounded-sm hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                >
                  Sign Up
                </button>
                <div className="md:hidden mt-4 text-center">
                  <span onClick={toggleForm} className="text-sm text-gray-400 hover:text-white cursor-pointer">
                    Already have an account? <span className="font-semibold">Sign In</span>
                  </span>
                </div>
                <div className="text-center">
                  <span onClick={toggleForm} className="text-sm text-gray-400 hover:text-white cursor-pointer">
                    Already have an account?{" "}
                    <span className="font-semibold">Go back to login</span>
                  </span>
                </div>
              </form>
            </div>
          </div>

          {/* Side Panel */}
          <div
            className={`hidden md:flex absolute top-0 right-0 w-1/2 h-full transition-transform duration-500 ease-in-out ${
              isSignUp ? "translate-x-full" : "translate-x-0"
            } bg-gray-900 border-l border-gray-800`}
          >
            <div className="h-full w-full flex flex-col justify-center items-center text-center p-12 text-white">
              {!isSignUp ? (
                <>
                  <h2 className="text-3xl font-bold mb-4">New Here?</h2>
                  <p className="mb-8 text-gray-400">
                    Sign up and discover the world of space engineering through our CanSat program.
                  </p>
                  <button
                    onClick={toggleForm}
                    className="border border-gray-700 text-white py-2 px-8 rounded-sm hover:bg-gray-800 transition-colors"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
                  <p className="mb-8 text-gray-400">
                    To continue your journey with us, please log in with your personal info.
                  </p>
                  <button
                    onClick={toggleForm}
                    className="border border-gray-700 text-white py-2 px-8 rounded-sm hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scoped CSS for the animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default LoginSignupPage;