"use client";
import React, { useEffect, useRef, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PhoneIcon from "@mui/icons-material/Phone";
// import CopyToClipboard from "react-copy-to-clipboard";
import Peer from "simple-peer";
import io from "socket.io-client";
import Image from "next/image";
import copy from 'clipboard-copy';

const socket = io.connect("https://videochat-app-kt94.onrender.com");

const Videochat = () => {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  
  

  const myVideo = useRef(null);
  const userVideo = useRef(null);
  const connectionRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setStream(stream);
          if (myVideo.current) {
            myVideo.current.srcObject = stream;
          }
        })
        .catch((error) =>
          console.error("Error accessing media devices:", error)
        );

      socket.on("me", (id) => setMe(id));
      socket.on("callUser", (data) => {
        setReceivingCall(true);
        setCaller(data.from);
        setName(data.name);
        setCallerSignal(data.signal);
      });
    }
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });

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

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });

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
    connectionRef.current?.destroy();
  };
  const handleCopyClick = async () => {
    try {
      if (!me) {
        throw new Error("No ID to copy");
      }
      await navigator.clipboard.writeText(me); // Use the `me` state value
      setIsCopied(true);
  
      // Reset the copied state after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text to clipboard", error);
    }
  };
  
 
  return (
    <div className="bg-custom-gradient min-h-screen flex flex-col pt-10">
      <h1 className="text-center font-bold text-4xl text-white">Chatt.io</h1>
      <div className="md:grid md:grid-cols-6  xl:flex   items-center justify-center xl:mt-24">
        <div
          className="md:col-span-3 xl:mt-0 xl:p-0 mt-5 p-5

       "
        >
          <div className="xl:mr-12">
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              style={{ width: "500px", borderRadius: "15px" }}
            />
          </div>
          <div>
            {callAccepted && !callEnded && (
              <video
                playsInline
                ref={userVideo}
                autoPlay
                style={{ width: "500px", borderRadius: "15px" }}
              />
            )}
          </div>
        </div>
        {/* right section */}

        <div className="md:col-span-3 ml-4  xl:mt-0 xl:p-0 ">
          <div
            className="flex flex-col items-center justify-center bg-white mt- rounded-md p-5 "
            style={{ width: "380px", height: "380px" }}
          >
            <TextField
              label="Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginBottom: "20px", marginTop: "20px" }}
            />

<div className="flex flex-col">
  <TextField
    label="Your ID"
    variant="outlined"
    value={me}
    
    InputProps={{
      readOnly: true, // Make the field read-only
    }}
  />
  <button
    className="btn btn-primary"
    onClick={handleCopyClick}
    style={{
      padding: "10px",
      marginTop: "10px",
      borderRadius: "5px",
      marginBottom:"15px",
      backgroundColor: isCopied ? "green" : "blue",
      color: "white",
    }}
  >
    {isCopied ? "Copied!" : "Copy My ID"}
  </button>
</div>


            <TextField
              label="ID to call"
              variant="outlined"
              value={idToCall}
              onChange={(e) => setIdToCall(e.target.value)}
            />
            <div className="mt-5">
              {callAccepted && !callEnded ? (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={leaveCall}
                >
                  End Call
                </Button>
              ) : (
                <IconButton
                  color="primary"
                  aria-label="call"
                  onClick={() => callUser(idToCall)}
                >
                  <PhoneIcon
                    fontSize="large"
                    style={{
                      height: "50px",
                      width: "50px",
                    }}
                    className="border-2 border-green-500 rounded-full p-2"
                  />
                </IconButton>
              )}
            </div>
            {receivingCall && !callAccepted && (
              <div className="caller">
                <h1 className="mb-2">{name} is calling...</h1>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={answerCall}
                >
                  Answer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Videochat;
