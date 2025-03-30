"use client";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";
import Link from "next/link";

const Navbar = () => {
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <nav className="flex justify-between items-center px-8 py-6">
      <Link href={"/"} className="text-2xl font-bold tracking-wide">
        ✨ InfluencerConnect
      </Link>
      <div>
        {token ? (
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/profile")}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push("/register/influencer")}
              className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition"
            >
              For Influencers
            </button>
            <button
              onClick={() => router.push("/register")}
              className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg transition"
            >
              For Users
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-purple-500 hover:bg-purple-600 px-6 py-2 rounded-lg transition"
            >
              Login
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
