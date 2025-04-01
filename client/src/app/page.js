"use client";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-24">
        <h2 className="text-6xl font-extrabold mb-6 leading-tight">
          Connect with Top Influencers Instantly
        </h2>
        <p className="max-w-xl text-gray-300 mb-8">
          Real-time video, voice, and chat with your favorite influencers. Pay
          by the minute and get exclusive insights.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/videocall")}
            className="bg-green-500 hover:bg-green-600 px-8 py-3 rounded-full text-lg transition shadow-lg"
          >
            Start a Call
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="bg-yellow-500 hover:bg-yellow-600 px-8 py-3 rounded-full text-lg transition shadow-lg"
          >
            Recharge Wallet
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8 px-12 py-16">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold">💬 Real-time Communication</h3>
          <p className="text-gray-400 mt-2">
            Video, voice, and chat with seamless performance.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold">💸 Monetize Your Time</h3>
          <p className="text-gray-400 mt-2">
            Set your rates and earn with every interaction.
          </p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:scale-105 transition">
          <h3 className="text-xl font-semibold">📊 Admin Control</h3>
          <p className="text-gray-400 mt-2">
            Manage influencers, users, and transactions with ease.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-t from-gray-900 to-black">
        <h2 className="text-4xl font-bold">
          Ready to Experience Seamless Communication?
        </h2>
        <p className="text-gray-400 mt-4">
          Join us today and start connecting with top influencers.
        </p>
        <button
          onClick={() => router.push("/get-started")}
          className="bg-pink-500 hover:bg-pink-600 px-10 py-4 rounded-full mt-6 text-lg transition shadow-lg"
        >
          Get Started
        </button>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500">
        &copy; {new Date().getFullYear()} InfluencerConnect. All rights
        reserved.
      </footer>
    </main>
  );
}
