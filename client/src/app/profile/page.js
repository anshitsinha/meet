"use client";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [influencers, setInfluencers] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    walletBalance: 0,
    ratePerMinute: { video: 0, voice: 0, chat: 0 },
    availability: { days: [], timeSlots: [] },
  });
  const [callMode, setCallMode] = useState(null); // To track selected call type
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user profile
    const fetchUser = async () => {
      try {
        const res = await axios.get( `${process.env.NEXT_PUBLIC_SERVER}/user-profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(res.data.user);

        const { username, email, walletBalance, ratePerMinute, availability } =
          res.data.user;
        setFormData({
          username,
          email,
          walletBalance,
          ratePerMinute: ratePerMinute || { video: 0, voice: 0, chat: 0 },
          availability: availability || { days: [], timeSlots: [] },
        });

        console.log(user);
      } catch (error) {
        console.error(error);
        router.push("/login");
      }
    };

    // Fetch influencers list
    const fetchInfluencers = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_SERVER}/get-influencers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInfluencers(res.data.influencers);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUser();
    fetchInfluencers();
  }, [router]); // Added router as a dependency for useEffect

  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      username: user.username,
      email: user.email,
      walletBalance: user.walletBalance || 0,
      ratePerMinute: user.ratePerMinute || { video: 0, voice: 0, chat: 0 },
      availability: user.availability || { days: [], timeSlots: [] },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("ratePerMinute")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        ratePerMinute: {
          ...prev.ratePerMinute,
          [field]: Number(value),
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await axios.put(
        `${process.env.NEXT_PUBLIC_SERVER}/update-profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data.user);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleRecharge = async () => {
    const amount = prompt("Enter amount to recharge your wallet:");
    if (amount && !isNaN(amount)) {
      const newBalance = formData.walletBalance + Number(amount);
      setFormData((prev) => ({ ...prev, walletBalance: newBalance }));

      try {
        const res = await axios.post(
         `${process.env.NEXT_PUBLIC_SERVER}/wallet/recharge`,
          { amount: Number(amount) },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        alert(res.data.message);
        setFormData((prev) => ({ ...prev, walletBalance: res.data.wallet })); // Update with response data
      } catch (error) {
        console.error("Error recharging wallet:", error);
        alert("Error recharging wallet. Please try again.");
      }
    }
  };

  const handleCall = (callType) => {
    setCallMode(callType); // Set the call mode (video, voice, chat)
  };

  const canMakeCall = (callType) => {
    // Logic to check if user can make a call based on balance, etc.
    return user && user.wallet >= user.ratePerMinute[callType];
  };

  const handleSelectInfluencer = (influencer) => {
    alert(`You selected ${influencer.username} for ${callMode} call`);
    // Proceed with the call logic
  };

  console.log(influencers);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />
      <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md my-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Profile</h1>
  
        {editMode ? (
          <div className="flex flex-col gap-5">
            <label className="block">
              <span className="text-gray-700 font-medium mb-1 block">Email:</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </label>
            <label className="block">
              <span className="text-gray-700 font-medium mb-1 block">Username:</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </label>
  
            {user.role === "influencer" && (
              <>
                <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4 border-b pb-2">Influencer Details</h2>
                <label className="block">
                  <span className="text-gray-700 font-medium mb-1 block">Rate Per Minute (Video):</span>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      name="ratePerMinute.video"
                      value={formData.ratePerMinute.video}
                      onChange={handleChange}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium mb-1 block">Rate Per Minute (Voice):</span>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      name="ratePerMinute.voice"
                      value={formData.ratePerMinute.voice}
                      onChange={handleChange}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium mb-1 block">Rate Per Minute (Chat):</span>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      name="ratePerMinute.chat"
                      value={formData.ratePerMinute.chat}
                      onChange={handleChange}
                      className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium mb-1 block">Availability (Days):</span>
                  <input
                    type="text"
                    name="availability.days"
                    value={formData.availability.days.join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        availability: {
                          ...prev.availability,
                          days: e.target.value
                            .split(",")
                            .map((day) => day.trim()),
                        },
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="Monday, Tuesday, Friday"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700 font-medium mb-1 block">Availability (Time Slots):</span>
                  <input
                    type="text"
                    name="availability.timeSlots"
                    value={formData.availability.timeSlots.join(", ")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        availability: {
                          ...prev.availability,
                          timeSlots: e.target.value
                            .split(",")
                            .map((slot) => slot.trim()),
                        },
                      }))
                    }
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="9AM-12PM, 2PM-5PM"
                  />
                </label>
              </>
            )}
  
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition shadow-md"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium transition shadow-md"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-8">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Email:</span>
                  <span className="text-gray-900 font-medium">{user.email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Username:</span>
                  <span className="text-gray-900 font-medium">{user.username}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-600 text-sm">Wallet Balance:</span>
                  <span className="text-green-600 font-bold text-xl">${user.wallet}</span>
                </div>
              </div>
  
              {user.role === "influencer" && (
                <div className="mt-6 pt-4 border-t border-blue-100">
                  <h2 className="text-xl font-semibold text-blue-800 mb-4">Influencer Rates</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <p className="text-gray-500 text-sm">Video Rate</p>
                      <p className="text-blue-600 font-bold">${user.ratePerMinute.video}/min</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <p className="text-gray-500 text-sm">Voice Rate</p>
                      <p className="text-blue-600 font-bold">${user.ratePerMinute.voice}/min</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <p className="text-gray-500 text-sm">Chat Rate</p>
                      <p className="text-blue-600 font-bold">${user.ratePerMinute.chat}/min</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-600 text-sm">Availability:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {user.availability.days.map(day => (
                        <span key={day} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {day}
                        </span>
                      ))}
                      <span className="mx-2 text-gray-400">|</span>
                      {user.availability.timeSlots.map(slot => (
                        <span key={slot} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={handleEdit}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
  
              <button
                onClick={handleRecharge}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-medium transition shadow-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Recharge Wallet
              </button>
            </div>
  
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Communication Options</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleCall("video")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    <path d="M14 6a2 2 0 012-2h2a2 2 0 012 2v8a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                  </svg>
                  Video Call
                </button>
                <button
                  onClick={() => handleCall("voice")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Voice Call
                </button>
                <button
                  onClick={() => handleCall("chat")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition shadow-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                  Chat
                </button>
              </div>
            </div>
  
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Select Influencer</h2>
              <div className="overflow-x-auto bg-white shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th className="px-4 py-3 text-gray-600 font-semibold">Username</th>
                      <th className="px-4 py-3 text-gray-600 font-semibold">Video Rate</th>
                      <th className="px-4 py-3 text-gray-600 font-semibold">Voice Rate</th>
                      <th className="px-4 py-3 text-gray-600 font-semibold">Chat Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencers.map((influencer) => (
                      <tr
                        key={influencer._id}
                        onClick={() => handleSelectInfluencer(influencer)}
                        className="cursor-pointer hover:bg-blue-50 transition border-b"
                      >
                        <td className="px-4 py-3 font-medium">{influencer.username}</td>
                        <td className="px-4 py-3">${influencer.ratePerMinute.video}</td>
                        <td className="px-4 py-3">${influencer.ratePerMinute.voice}</td>
                        <td className="px-4 py-3">${influencer.ratePerMinute.chat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
