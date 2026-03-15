"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  CheckCircle2, 
  Circle, 
  Rocket, 
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Loader2
} from "lucide-react";

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
  const [notificationType, setNotificationType] = useState<"success" | "error" | "info">("info");
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setErrors((prev: any) => ({ ...prev, password: "" }));
    }
  }, [password]);

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification(message);
    setNotificationType(type);
  };

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
    setIsForgotPassword(false);
    setVerificationSent(false);
  };

  const handleSchoolSelect = (name: string, placeId: any) => {
    setSelectedSchool({
      school_name: name,
      school_id: placeId,
    });
    setErrors((prev: any) => ({ ...prev, school: "" }));
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
      showNotification("Please fill out all required fields", "error");
      return;
    }

    const allCriteriaMet = Object.values(passwordCriteria).every((criteria) => criteria === true);
    if (!allCriteriaMet) {
      showNotification("Password must meet all requirements", "error");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);
      setVerificationSent(true);

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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend registration failed: ${errorText}`);
      }

      const data = await response.json();
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

      showNotification("Account created successfully. Please log in.", "success");

      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setSelectedSchool({ school_name: "", school_id: "" });
      setErrors({});
      setShowPasswordRequirements(false);
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      showNotification(`Error: ${error.message}. Please try again.`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();

      const loginResponse = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        console.error("Backend login failed:", errorData.error);
        showNotification(`Login succeeded, but backend logging failed: ${errorData.error}. Contact support.`, "error");
        return;
      }

      const loginData = await loginResponse.json();
      console.log("Backend login successful:", loginData);

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.verified !== user.emailVerified) {
          await updateDoc(userRef, {
            verified: user.emailVerified,
          });
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
        router.push(`/dashboard/${userData.role}`);
      } else {
        console.error("User not found in Firestore");
        showNotification("User data not found. Please contact support.", "error");
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      showNotification("Error logging in. Please check your credentials.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      showNotification("Please enter your email address.", "error");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showNotification("Password reset email sent. Please check your inbox.", "success");
      setResetEmail("");
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error("Error sending password reset email:", error.message);
      showNotification(`Error: ${error.message}. Please try again.`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const user = auth.currentUser;
      console.log(user);
      await sendEmailVerification(user!);
      if (user && !user.emailVerified) {
        await sendEmailVerification(user);
        showNotification("Verification email resent. Please check your inbox or spam folder.", "success");
      } else if (user && user.emailVerified) {
        showNotification("Your email is already verified. Please log in.", "info");
      } else {
        showNotification("No user is currently signed in. Please sign up or log in first.", "error");
      }
    } catch (error: any) {
      console.error("Error resending verification email:", error.message);
      showNotification(`Error: ${error.message}. Please try again.`, "error");
    }
  };

  const getNotificationStyles = () => {
    switch (notificationType) {
      case "success":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case "error":
        return "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
      default:
        return "bg-primary/5 text-primary border-primary/20";
    }
  };

  const PasswordRequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <li className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className={met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
        {text}
      </span>
    </li>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Side - Branding Panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/main-background.png')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold">CanSat</span>
          </Link>

          {/* Center Content */}
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <div className="mb-8">
              <Sparkles className="h-12 w-12 mb-6 text-white/80" />
              <h1 className="text-4xl font-bold mb-4 leading-tight text-balance">
                {isSignUp ? "Join the Space Engineering Journey" : "Welcome Back, Explorer"}
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                {isSignUp 
                  ? "Create your account and start building satellites with our hands-on CanSat program."
                  : "Continue your journey in space education. Your next mission awaits."
                }
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                { icon: GraduationCap, text: "Learn satellite engineering fundamentals" },
                { icon: Rocket, text: "Build and launch your own CanSat" },
                { icon: Sparkles, text: "Collaborate with fellow space enthusiasts" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/60 text-sm">
            Avakas Lab - Space Education for the Next Generation
          </p>
        </div>
      </div>

      {/* Right Side - Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link href="/" className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-semibold text-foreground">CanSat</span>
          </Link>

          {/* Form Content */}
          {!isForgotPassword ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                  {isSignUp ? "Create Account" : "Sign In"}
                </h2>
                <p className="text-muted-foreground">
                  {isSignUp 
                    ? "Fill in your details to get started" 
                    : "Enter your credentials to access your account"
                  }
                </p>
              </div>

              {/* Notification */}
              {notification && (
                <div className={`mb-6 p-4 rounded-xl border text-sm ${getNotificationStyles()}`}>
                  {notification}
                </div>
              )}

              {/* Sign In Form */}
              {!isSignUp ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground border border-border transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground border border-border transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <span className="text-sm text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  {verificationSent && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="w-full text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      Resend Verification Email
                    </button>
                  )}

                  <div className="text-center pt-4">
                    <span className="text-muted-foreground text-sm">
                      {"Don't have an account? "}
                      <button
                        type="button"
                        onClick={toggleForm}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Sign Up
                      </button>
                    </span>
                  </div>
                </form>
              ) : (
                /* Sign Up Form */
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder-muted-foreground border transition-all ${
                            errors.firstName ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
                          }`}
                        />
                      </div>
                      {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder-muted-foreground border transition-all ${
                            errors.lastName ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
                          }`}
                        />
                      </div>
                      {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder-muted-foreground border transition-all ${
                          errors.email ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
                        }`}
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setShowPasswordRequirements(true)}
                        onBlur={() => setShowPasswordRequirements(false)}
                        className={`w-full pl-12 pr-12 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 text-foreground placeholder-muted-foreground border transition-all ${
                          errors.password ? "border-red-500 focus:ring-red-500" : "border-border focus:ring-primary"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
                    
                    {/* Password Requirements */}
                    {showPasswordRequirements && (
                      <div className="mt-3 p-4 bg-secondary/50 border border-border rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <p className="font-medium text-foreground mb-3 text-sm">Password Requirements</p>
                        <ul className="space-y-2 text-sm">
                          <PasswordRequirementItem met={passwordCriteria.length} text="At least 8 characters" />
                          <PasswordRequirementItem met={passwordCriteria.uppercase} text="One uppercase letter" />
                          <PasswordRequirementItem met={passwordCriteria.lowercase} text="One lowercase letter" />
                          <PasswordRequirementItem met={passwordCriteria.special} text="One special character (!@#$)" />
                          <PasswordRequirementItem met={passwordCriteria.number} text="One number (0-9)" />
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">School</label>
                    <HighSchoolSearch onSelect={handleSchoolSelect} Style={"MaterialUI"} />
                    {selectedSchool.school_name ? (
                      <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {selectedSchool.school_name}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Search and select your school</p>
                    )}
                    {errors.school && <p className="text-red-500 text-xs">{errors.school}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </button>

                  {verificationSent && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      className="w-full text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                    >
                      Resend Verification Email
                    </button>
                  )}

                  <div className="text-center pt-4">
                    <span className="text-muted-foreground text-sm">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={toggleForm}
                        className="text-primary hover:text-primary/80 font-semibold transition-colors"
                      >
                        Sign In
                      </button>
                    </span>
                  </div>
                </form>
              )}
            </>
          ) : (
            /* Forgot Password Form */
            <>
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </button>

              <div className="mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Reset Password</h2>
                <p className="text-muted-foreground">
                  {"Enter your email and we'll send you a link to reset your password."}
                </p>
              </div>

              {notification && (
                <div className={`mb-6 p-4 rounded-xl border text-sm ${getNotificationStyles()}`}>
                  {notification}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-secondary/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground border border-border transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginSignupPage;
