import { createSlice } from "@reduxjs/toolkit";
import io from "socket.io-client";
const initalState = {
socket:io( "http://localhost:8001" 
),
}

const socketSlice = createSlice({
  name:"Socket",
  initialState:initalState,
  reducers: {
    
  }
})

export default socketSlice.reducer;
//export const {login,logout}=authslice.actions;