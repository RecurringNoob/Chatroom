import React, { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { socket } from "../socketComp/socket";
import { useParams } from "react-router-dom";

export default function Room() {
  const { roomId } = useParams();
  const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [iceCandidates, setIceCandidates] = useState([]);
  const dispatch = useDispatch();
  
  // Set up local media stream
  useEffect(() => {
    const setupMediaStream = async () => {
      
      try {
        console.log("Requesting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        console.log("Got local stream with tracks:", stream.getTracks().map(t => t.kind));
        setLocalStream(stream);
        
        // Add local stream tracks to peer connection
        stream.getTracks().forEach(track => {
          console.log("Adding track to peer connection:", track.kind);
          window.peer.addTrack(track, stream);
        });
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    };
    
    setupMediaStream();
    
    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Set up peer connection event handlers
  useEffect(() => {
    if (!window.peer) {
      console.error("Peer connection not initialized!");
      return;
    }
    
    // Debug connection states
    window.peer.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", window.peer.iceConnectionState);
      setConnectionState(prev => `${prev}, ice: ${window.peer.iceConnectionState}`);
    };
    
    window.peer.onconnectionstatechange = () => {
      console.log("Connection state:", window.peer.connectionState);
      setConnectionState(prev => `${prev}, connection: ${window.peer.connectionState}`);
    };
    
    window.peer.onsignalingstatechange = () => {
      console.log("Signaling state:", window.peer.signalingState);
      setConnectionState(prev => `${prev}, signaling: ${window.peer.signalingState}`);
    };
    
    // Handle remote tracks
    window.peer.ontrack = (event) => {
      console.log("🎉 Got remote track:", event.streams[0]);
      console.log("Remote tracks:", event.streams[0].getTracks().map(t => t.kind));
      if (event.streams[0].getVideoTracks().length === 0) {
          console.warn("Remote stream has no video tracks!");
      } else {
          console.log("Remote stream has video tracks. Is it black?"); // New log
      }
      if (event.streams[0].getAudioTracks().length === 0) {
          console.warn("Remote stream has no audio tracks!");
      }
      setRemoteStream(event.streams[0]);
  };

    
    // Handle ICE candidates
    window.peer.onicecandidate = (event) => {
      if (event.candidate) {
          console.log("Generated ICE candidate", event.candidate.candidate.substring(0, 50) + "...");
          setIceCandidates(prev => [...prev, event.candidate]);
          // No event.email here. This candidate is generated *by this peer*.
          socket.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
              // You might want to send your own email here if the backend needs it for relaying
              // email: socketIdToEmail.get(socket.id) // This would require getting current user's email, or the backend can infer
          });
      } else {
          console.log("ICE candidate gathering complete");
      }
  };
    
    return () => {
      // Cleanup event handlers
      window.peer.ontrack = null;
      window.peer.onicecandidate = null;
      window.peer.oniceconnectionstatechange = null;
      window.peer.onconnectionstatechange = null;
      window.peer.onsignalingstatechange = null;
    };
  }, [roomId]);
  
  const handleNewUserJoined = useCallback(async (data) => {
    const { email } = data;
    console.log("New user joined:", email);
    
    try {
      console.log("Creating offer...");
      const offer = await window.peer.createOffer();
      console.log("Offer created:", offer.sdp.substring(0, 100) + "...");
      
      console.log("Setting local description...");
      await window.peer.setLocalDescription(offer);
      console.log("Local description set");
      
      socket.emit("call-user", {
        email,
        offer,
        roomId
      });
      console.log("Offer sent to:", email);
    } catch (err) {
      console.error("Error in handleNewUserJoined:", err);
    }
  }, [roomId]);
  
  const handleIncomingCall = useCallback(async (data) => {
    console.log("Incoming call from:", data.email);
    const { offer, email } = data;
    
    try {
      if (!offer) {
        console.error("Received null/undefined offer");
        return;
      }
      
      console.log("Setting remote description (offer)...");
      await window.peer.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("Remote description set");
      
      console.log("Creating answer...");
      const answer = await window.peer.createAnswer();
      console.log("Answer created");
      
      console.log("Setting local description (answer)...");
      await window.peer.setLocalDescription(answer);
      console.log("Local description set");
      
      socket.emit("call-answered", {
        email,
        answer,
        roomId
      });
      console.log("Answer sent to:", email);
    } catch (err) {
      console.error("Error handling incoming call:", err);
    }
  }, [roomId]);
  
  const handleCallAnswered = useCallback(async (data) => {
    console.log("Call answered by:", data.email);
    const { answer } = data;
    
    try {
      if (!answer) {
        console.error("Received null/undefined answer");
        return;
      }
      
      console.log("Setting remote description (answer)...");
      await window.peer.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Remote description set");
    } catch (err) {
      console.error("Error setting remote answer:", err);
    }
  }, []);
  
  const handleIceCandidate = useCallback(async (data) => {
    const { candidate, email } = data;
    console.log("Received ICE candidate from:", email);
    
    try {
      if (candidate && window.peer) {
        console.log("Adding ICE candidate:", candidate.candidate?.substring(0, 50) + "...");
        await window.peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("ICE candidate added successfully");
      }
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }, []);
  
  useEffect(() => {
    console.log("Setting up socket event listeners...");
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleCallAnswered);
    socket.on("ice-candidate", handleIceCandidate);
    
    return () => {
      console.log("Cleaning up socket event listeners...");
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleCallAnswered);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [handleNewUserJoined, handleIncomingCall, handleCallAnswered, handleIceCandidate]);

  return (
    <div className="room-container">
      <h1>Room: {roomId}</h1>
      <div className="connection-status">
        <p>Connection State: {connectionState}</p>
        <p>ICE Candidates Generated: {iceCandidates.length}</p>
        <p>Remote Stream: {remoteStream ? '✅ Connected' : '❌ Not connected'}</p>
      </div>
      
      <div className="video-container">
        <div className="video-item">
          <h2>Local Stream</h2>
          {localStream ? (
            <video 
              autoPlay 
              muted 
              ref={(video) => {
                if (video && localStream) {
                  video.srcObject = localStream;
                  console.log("Local video element setup with stream");
                }
              }}
              className="video-element"
            />
          ) : (
            <div className="no-stream">Setting up local stream...</div>
          )}
        </div>
        
        <div className="video-item">
          <h2>Remote Stream</h2>
          {remoteStream ? (
            <video 
              autoPlay 
              ref={(video) => {
                if (video && remoteStream) {
                  video.srcObject = remoteStream;
                  console.log("Remote video element setup with stream");
                }
              }}
              className="video-element"
            />
          ) : (
            <div className="no-stream">Waiting for remote stream...</div>
          )}
        </div>
      </div>
    </div>
  );
}