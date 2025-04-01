"use client";

import axios from "axios";
import { useEffect, useRef, useState } from "react";



export default function VideoCall({ influencer, onEndCall, callType }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const [status, setStatus] = useState("Connecting...");
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callLink, setCallLink] = useState("");

  useEffect(() => {
    let reconnectTimeout = null;
    let callId = null; // Generate unique call ID

    async function initWebRTC() {
      try {
        setStatus("Initializing call...");

        // Get WebRTC token
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_SERVER}/webrtc-token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Generate a unique call ID
        callId = `${Math.random().toString(36).substring(2, 15)}`;
        setCallLink(`${window.location.origin}/join-call/${callId}`); // Unique URL

        // Initialize WebSocket connection
        const ws = new WebSocket(`wss://localhost:5000`, response.data.token);
        socketRef.current = ws;

        ws.onopen = () => {
          setStatus("Connected, sending call request...");
          sendWebSocketMessage({
            type: "call-request",
            recipientId: influencer._id,
            callType,
            callId, // Send call ID to the other participant
          });
        };

        ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        };

        ws.onclose = (event) => {
          console.warn("WebSocket closed:", event.reason);
          setStatus("Disconnected. Reconnecting...");
          reconnectTimeout = setTimeout(initWebRTC, 3000);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          ws.close();
        };

        // Initialize WebRTC
        const config = {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        };
        const pc = new RTCPeerConnection(config);
        pcRef.current = pc;

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendWebSocketMessage({
              type: "candidate",
              candidate: event.candidate,
              recipientId: influencer._id,
              callId,
            });
          }
        };

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Get user media
        const constraints = { audio: true, video: callType === "video" };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Initiate offer
        if (callType) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendWebSocketMessage({
            type: "offer",
            offer,
            recipientId: influencer._id,
            callId,
            callType,
          });
        }

        setStatus("Call in progress");
        startCallTimer();
      } catch (error) {
        console.error("WebRTC Initialization Failed:", error);
        setStatus("Failed to connect");
      }
    }

    function sendWebSocketMessage(message) {
      const ws = socketRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      } else {
        console.warn("WebSocket not open. Retrying...");
        setTimeout(() => sendWebSocketMessage(message), 100);
      }
    }

    async function handleWebSocketMessage(message) {
      if (!pcRef.current) return;

      if (message.type === "offer") {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        sendWebSocketMessage({
          type: "answer",
          answer,
          recipientId: message.senderId,
          callId,
        });
      } else if (message.type === "answer") {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(message.answer)
        );
      } else if (message.type === "candidate") {
        await pcRef.current.addIceCandidate(
          new RTCIceCandidate(message.candidate)
        );
      }
    }

    function startCallTimer() {
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setCallDuration(seconds);
      }, 1000);
    }

    initWebRTC();

    return () => {
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) socketRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [callType]);

  const toggleMute = () => {
    const audioTracks = localVideoRef.current?.srcObject?.getAudioTracks();
    if (audioTracks) audioTracks.forEach((track) => (track.enabled = !track.enabled));
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    const videoTracks = localVideoRef.current?.srcObject?.getVideoTracks();
    if (videoTracks) videoTracks.forEach((track) => (track.enabled = !track.enabled));
    setIsVideoOff(!isVideoOff);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
      <div className="text-white text-lg mb-4">
        Call with {influencer.username} ({callType} call) - {status}
      </div>

      <div className="relative w-full max-w-4xl h-96 bg-gray-800 rounded-lg overflow-hidden mb-4">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        {callType === "video" && (
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-900 rounded-md overflow-hidden border border-gray-600">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="text-white text-xl mb-6">Duration: {formatTime(callDuration)}</div>

      <div className="flex gap-4">
        <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? "bg-red-600" : "bg-gray-700"} text-white`}>
          {isMuted ? "Unmute" : "Mute"}
        </button>
        {callType === "video" && (
          <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? "bg-red-600" : "bg-gray-700"} text-white`}>
            {isVideoOff ? "Enable Video" : "Disable Video"}
          </button>
        )}
        <button onClick={onEndCall} className="p-3 rounded-full bg-red-600 text-white">End Call</button>
      </div>

      {/* Display the link to join */}
      {callLink && (
        <div className="mt-4 text-white">
          Share this link with the other person to join the call: 
          <a href={callLink} className="text-blue-400">{callLink}</a>
        </div>
      )}
    </div>
  );
}
