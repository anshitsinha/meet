"use client";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login successful!");
      router.push("/profile");
    } catch (error) {
      console.error(error);
      alert("Invalid email or password.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="p-8 shadow-lg rounded-lg bg-gray-100">
        <h1 className="text-2xl mb-4">Login</h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="block w-full p-2 mb-2 border"
        />

        {/* Password Input */}
        <div className="relative w-full mb-4">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full p-2 border pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-3 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        {/* Login Button */}
        <button type="submit" className="bg-green-500 px-4 py-2 text-white w-full mb-4">
          Login
        </button>

        {/* No Account? Register */}
        <div className="text-center">
          <p>
            No account?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-blue-500 hover:underline"
            >
              Register
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
