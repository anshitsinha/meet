"use client";

import { FaRegCopy, FaPhoneAlt } from "react-icons/fa";
import React, { useEffect, useRef, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";

const socket = io.connect(`${process.env.NEXT_PUBLIC_SERVER}`);

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
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

  console.log(process.env.NEXT_PUBLIC_SERVER);
  console.log("My ID:", me);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.on("me", (id) => setMe(id));
    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });
  }, []);

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
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) =>
      socket.emit("answerCall", { signal: data, to: caller })
    );
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Zoomish</h1>
      <div className="flex gap-6 w-full max-w-4xl">
        <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          {stream && (
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full rounded-lg"
            />
          )}
        </div>
        <div className="flex-1 bg-gray-800 p-4 rounded-lg shadow-lg">
          {callAccepted && !callEnded ? (
            <video
              playsInline
              ref={userVideo}
              autoPlay
              className="w-full rounded-lg"
            />
          ) : null}
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
        <CopyToClipboard text={me}>
          <button className="w-full py-2 mb-4 bg-blue-500 hover:bg-blue-600 rounded flex items-center justify-center">
            <FaRegCopy className="mr-2" /> Copy ID
          </button>
        </CopyToClipboard>{" "}
        {me}
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
          >
            <FaPhoneAlt className="mr-2" /> Call
          </button>
        )}
      </div>
      {receivingCall && !callAccepted && (
        <div className="mt-6 p-6 bg-gray-800 rounded-lg shadow-lg text-center">
          <h2 className="mb-4 text-xl font-bold">{name} is calling...</h2>
          <button
            className="py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded"
            onClick={answerCall}
          >
            Answer
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
