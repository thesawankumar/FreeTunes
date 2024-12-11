"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      // Add actual login functionality here
    }, 2000);
  };

  const Loader = () => (
    <motion.div
      className="flex justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-12 h-12 border-4 border-t-transparent border-indigo-500 border-solid rounded-full animate-spin"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderTopColor: 'rgba(255, 255, 255, 0.8)',
        }}
      />
    </motion.div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-700 rounded-full filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-700 rounded-full filter blur-[100px] opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full filter blur-[100px] animate-spin-slow"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md bg-gray-800 bg-opacity-80 p-8 rounded-xl shadow-xl">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h2
            className="text-3xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            Welcome Back!
          </motion.h2>
          <motion.p
            className="text-lg text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Sign in to continue to your favorite music!
          </motion.p>
        </motion.div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 pl-10 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
                <Lock className="ml-2 h-5 w-5" />
              </span>
            </div>

            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pl-10 bg-white/10 border border-white/20 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white">
                <Lock className="ml-2 h-5 w-5" />
              </span>
            </div>
          </div>

          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold px-8 py-4 rounded-full hover:scale-105 transition-all"
            disabled={isLoading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {isLoading ? <Loader /> : "Log In"}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/signup">
            <motion.a
              className="text-indigo-400 hover:text-indigo-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Don't have an account? Sign up here.
            </motion.a>
          </Link>
        </div>
      </div>
    </div>
  );
}
