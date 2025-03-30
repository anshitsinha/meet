"use client";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [name, setName] = useState("");
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState(0);

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { name });
      setUser(res.data.user);
      setWallet(res.data.user.wallet);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleRecharge = async () => {
    try {
      const res = await axios.post("http://localhost:5000/recharge", {
        id: user.id,
        amount: rechargeAmount,
      });
      setWallet(res.data.wallet);
    } catch (error) {
      console.error("Recharge failed:", error);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Bingeme Demo</h1>

      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white p-2 ml-2">
        Login
      </button>

      {user && (
        <div className="mt-5">
          <h2>Welcome, {user.name}</h2>
          <p>Wallet Balance: ${wallet}</p>
          <input
            type="number"
            placeholder="Recharge Amount"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(Number(e.target.value))}
            className="border p-2"
          />
          <button
            onClick={handleRecharge}
            className="bg-green-500 text-white p-2 ml-2"
          >
            Recharge
          </button>
        </div>
      )}
    </div>
  );
}
