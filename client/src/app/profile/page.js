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
        const res = await axios.get("http://localhost:5000/user-profile", {
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
        const res = await axios.get("http://localhost:5000/get-influencers", {
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
        "http://localhost:5000/update-profile",
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
          "http://localhost:5000/wallet/recharge",
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
    <div>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl">Profile</h1>

        {editMode ? (
          <div className="flex flex-col gap-4">
            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border p-2"
              />
            </label>
            <label>
              Username:
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="border p-2"
              />
            </label>

            {user.role === "influencer" && (
              <>
                <h2 className="text-xl mt-4">Influencer Details</h2>
                <label>
                  Rate Per Minute (Video):
                  <input
                    type="number"
                    name="ratePerMinute.video"
                    value={formData.ratePerMinute.video}
                    onChange={handleChange}
                    className="border p-2"
                  />
                </label>
                <label>
                  Rate Per Minute (Voice):
                  <input
                    type="number"
                    name="ratePerMinute.voice"
                    value={formData.ratePerMinute.voice}
                    onChange={handleChange}
                    className="border p-2"
                  />
                </label>
                <label>
                  Rate Per Minute (Chat):
                  <input
                    type="number"
                    name="ratePerMinute.chat"
                    value={formData.ratePerMinute.chat}
                    onChange={handleChange}
                    className="border p-2"
                  />
                </label>
                <label>
                  Availability (Days):
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
                    className="border p-2"
                  />
                </label>
                <label>
                  Availability (Time Slots):
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
                    className="border p-2"
                  />
                </label>
              </>
            )}

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>Email: {user.email}</p>
            <p>Username: {user.username}</p>
            <p>Wallet Balance: ${user.wallet}</p>

            {user.role === "influencer" && (
              <>
                <p>Rate Per Minute (Video): ${user.ratePerMinute.video}</p>
                <p>Rate Per Minute (Voice): ${user.ratePerMinute.voice}</p>
                <p>Rate Per Minute (Chat): ${user.ratePerMinute.chat}</p>
                <p>
                  Availability: {user.availability.days.join(", ")} |{" "}
                  {user.availability.timeSlots.join(", ")}
                </p>
              </>
            )}

            <button
              onClick={handleEdit}
              className="bg-green-500 text-white px-4 py-2 rounded mt-4"
            >
              Edit Profile
            </button>

            <button
              onClick={handleRecharge}
              className="bg-yellow-500 text-white px-4 py-2 rounded mt-4"
            >
              Recharge Wallet
            </button>
            <div className="mt-4">
              {/* Call type buttons */}
              <button
                onClick={() => handleCall("video")}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Video Call
              </button>
              <button
                onClick={() => handleCall("voice")}
                className="bg-blue-500 text-white px-4 py-2 rounded ml-4"
              >
                Voice Call
              </button>
              <button
                onClick={() => handleCall("chat")}
                className="bg-blue-500 text-white px-4 py-2 rounded ml-4"
              >
                Chat
              </button>
            </div>
            <div className="mt-4">
              {/* Display influencer list */}
              <h2 className="text-xl font-semibold mb-3">Select Influencer</h2>
              <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-200 text-left">
                      <th className="px-4 py-2">Username</th>
                      <th className="px-4 py-2">Video Rate</th>
                      <th className="px-4 py-2">Voice Rate</th>
                      <th className="px-4 py-2">Chat Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {influencers.map((influencer) => (
                      <tr
                        key={influencer._id}
                        onClick={() => handleSelectInfluencer(influencer)}
                        className="cursor-pointer hover:bg-gray-100 border-b"
                      >
                        <td className="px-4 py-2">{influencer.username}</td>
                        <td className="px-4 py-2">
                          {influencer.ratePerMinute.video}
                        </td>
                        <td className="px-4 py-2">
                          {influencer.ratePerMinute.voice}
                        </td>
                        <td className="px-4 py-2">
                          {influencer.ratePerMinute.chat}
                        </td>
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
