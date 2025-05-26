import React from "react";

export default function Homepage()
{
  return(
    <div className="homepage-container">
      <div className="input-container">
        <input type="email" placeholder="enter your email"/>
        <input type="text" placeholder="Enter Room Code"/>
        <button> Enter Room</button>
      </div>
    </div>
  )
}