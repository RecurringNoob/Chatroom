import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { peer } from "../socketComp/peer.js";

// Thunk to create offer
export const createOffer = createAsyncThunk("Peer/createOffer", async (_, { getState }) => {
  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  } catch (error) {
    console.error("Error creating offer:", error);
    throw error;
  }
});

// Thunk to set remote answer
export const setRemoteAnswer = createAsyncThunk("Peer/setRemoteAnswer", async (answer, { getState }) => {
  try {
    await peer.setRemoteDescription(new RTCSessionDescription(answer));
    return answer;
  } catch (error) {
    console.error("Error setting remote answer:", error);
    throw error;
  }
});

const initialState = {
  offer: null,
  answer: null,
  remoteStream: null,
  localStream: null,
  connectionState: "new",
};

const peerSlice = createSlice({
  name: "Peer",
  initialState,
  reducers: {
    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    },
    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload;
    },
    updateConnectionState: (state, action) => {
      state.connectionState = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOffer.pending, (state) => {
        state.connectionState = "connecting";
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.offer = action.payload;
      })
      .addCase(createOffer.rejected, (state) => {
        state.connectionState = "failed";
      })
      .addCase(setRemoteAnswer.fulfilled, (state, action) => {
        state.answer = action.payload;
        state.connectionState = "connected";
      });
  },
});

export const { setLocalStream, setRemoteStream, updateConnectionState } = peerSlice.actions;
export default peerSlice.reducer;