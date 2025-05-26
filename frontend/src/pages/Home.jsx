import React, { useState } from "react";
import {socket} from "../socketComp/socket";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function Home()
{
  const navigate = useNavigate();
  const [email,setEmail]=useState(" ");
  const [room,setRoom]=useState("");

  const handleJoinRoom = ()=>{
  socket.emit("join-room",{email:email,roomId:room})
  }
  const handleRoomJoined=({roomId})=>{
    navigate(`/room/${roomId}`);
  }
  useEffect(()=>{
    socket.on("joined-room",handleRoomJoined);
  },[])
  

  return(
    <div className="homepage-container">
      <div className="input-container">
        <input 
        type="email" placeholder="enter your email"value={email} onChange={(e)=>{setEmail(e.target.value)}}/>
        <input type="text" placeholder="Enter Room Code" value={room} onChange={(e)=>{setRoom(e.target.value)}}/>
        <button onClick={()=>{
        handleJoinRoom();
        }}> Enter Room</button>
      </div>
    </div>
  )
}