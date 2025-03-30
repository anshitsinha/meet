"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5000");
        const data = await res.text();
        setMessage(data);
      } catch (error) {
        console.error("Failed to fetch:", error);
        setMessage("Failed to connect to Express server.");
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Express Server Status</h1>
      <p>{message}</p>
    </div>
  );
}
