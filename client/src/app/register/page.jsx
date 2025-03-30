"use client"; // Ensure this is at the top

import { useRouter } from "next/navigation";
import axios from "axios";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [serverResponse, setServerResponse] = useState(""); // Store server response
  const router = useRouter();

  // ✅ Fetch data from "/" on the Express server
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:5000/");
        setServerResponse(res.data); // Store response in state
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setServerResponse("Failed to fetch server data.");
      }
    };

    fetchData();
  }, []);

  // ✅ Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();

    console.log("📤 Sending POST request to server...");
    console.log("🔎 Payload:", { username, email, password });

    try {
      const res = await axios.post("http://localhost:5000/register/user", {
        username,
        email,
        password,
      });

      console.log("✅ Server response:", res.data);

      alert("Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      console.error("❌ POST request failed:", error);

      // Log the server error response if available
      if (error.response) {
        console.error("🔎 Server Error:", error.response.data);
      } else {
        console.error("🔎 Error details:", error.message);
      }

      alert("Registration failed!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 shadow-lg rounded-lg bg-gray-100">
        {/* Show server response */}
        <div className="mb-4 p-2 bg-green-100 border-l-4 border-green-500 text-green-700">
          <strong>Server Response:</strong> {serverResponse}
        </div>

        <form onSubmit={handleRegister}>
          <h1 className="text-2xl mb-4">Register</h1>

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="block w-full p-2 mb-2 border"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full p-2 mb-2 border"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="block w-full p-2 mb-4 border"
          />

          <button
            type="submit"
            className="bg-blue-500 px-4 py-2 text-white w-full"
          >
            Register
          </button>
        </form>

        <p>
          already have an acc?
          <Link href={"/login"} className="text-blue-400">
            <span> </span> Login
          </Link>
        </p>
      </div>
    </div>
  );
}
