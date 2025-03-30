"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const InfluencerRegister = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    ratePerMinute: {
      video: 0,
      voice: 0,
      chat: 0,
    },
    availability: {
      days: [],
      timeSlots: [],
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("ratePerMinute")) {
      const serviceType = name.split(".")[1];
      setFormData((prevData) => ({
        ...prevData,
        ratePerMinute: {
          ...prevData.ratePerMinute,
          [serviceType]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [name]: checked
          ? [...prev.availability[name], value]
          : prev.availability[name].filter((item) => item !== value),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_SERVER}/register/influencer`, formData);
      setSuccess("Influencer registered successfully!");
      router.push("/login");  // Redirect to login
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Influencer Registration</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          {/* Rates */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Rate (Video)</label>
              <input
                type="number"
                name="ratePerMinute.video"
                value={formData.ratePerMinute.video}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Rate (Voice)</label>
              <input
                type="number"
                name="ratePerMinute.voice"
                value={formData.ratePerMinute.voice}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Rate (Chat)</label>
              <input
                type="number"
                name="ratePerMinute.chat"
                value={formData.ratePerMinute.chat}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium">Availability</label>

            <div className="flex gap-4">
              <div>
                <h4 className="text-sm font-medium">Days</h4>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div key={day} className="flex items-center">
                    <input
                      type="checkbox"
                      name="days"
                      value={day}
                      onChange={handleCheckboxChange}
                      className="mr-2"
                    />
                    <label>{day}</label>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium">Time Slots</h4>
                {["10:00-12:00", "14:00-16:00", "18:00-20:00"].map((slot) => (
                  <div key={slot} className="flex items-center">
                    <input
                      type="checkbox"
                      name="timeSlots"
                      value={slot}
                      onChange={handleCheckboxChange}
                      className="mr-2"
                    />
                    <label>{slot}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>

          {/* Messages */}
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
        </form>
      </div>
    </div>
  );
};

export default InfluencerRegister;
