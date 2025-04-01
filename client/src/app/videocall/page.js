"use client";

import { FaRegCopy, FaPhoneAlt } from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import io from "socket.io-client";

const socket = io.connect(`${process.env.NEXT_PUBLIC_SERVER}`);

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Error accessing media devices:", err));

    socket.on("me", (id) => setMe(id));
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (stream && myVideo.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });
    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });
    socket.once("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    if (connectionRef.current) {
      connectionRef.current.destroy();
    }
    // Reset states
    setCallAccepted(false);
    setReceivingCall(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(me)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">✨ InfluencerConnect</h1>
      <div className="flex gap-6 w-full max-w-4xl">
        <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          <video
            playsInline
            muted
            ref={myVideo}
            autoPlay
            className="w-full rounded-lg"
          />
        </div>
        <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          {callAccepted && !callEnded ? (
            <video
              playsInline
              ref={userVideo}
              autoPlay
              className="w-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center">
              {!callAccepted && "Waiting for call..."}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        <button
          className="w-full py-2 mb-4 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center"
          onClick={copyToClipboard}
        >
          <FaRegCopy className="mr-2" /> Copy ID
        </button>

        <input
          type="text"
          value={idToCall}
          onChange={(e) => setIdToCall(e.target.value)}
          placeholder="Enter ID to call"
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none"
        />
        {callAccepted && !callEnded ? (
          <button
            className="w-full py-2 bg-red-500 hover:bg-red-600 rounded"
            onClick={leaveCall}
          >
            End Call
          </button>
        ) : (
          <button
            className="w-full py-2 bg-green-500 hover:bg-green-600 rounded flex items-center justify-center"
            onClick={() => callUser(idToCall)}
            disabled={!stream}
          >
            <FaPhoneAlt className="mr-2" /> Call
          </button>
        )}
      </div>
      {receivingCall && !callAccepted && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="mb-4 text-xl font-bold">{name} is calling...</h2>
          <button
            className="py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded mr-4"
            onClick={answerCall}
          >
            Answer
          </button>
          <button
            className="py-2 px-4 bg-red-500 hover:bg-red-600 rounded"
            onClick={() => setReceivingCall(false)}
          >
            Decline
          </button>
        </div>
      )}
      <div className="absolute bottom-0 left-0 text-xs opacity-15">{me}</div>
    </div>
  );
}

export default App;
