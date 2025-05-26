
import { configureStore } from '@reduxjs/toolkit';
import peerSlice from "./peerSlice.js"

const store = configureStore({
  reducer: {
   "Peer": peerSlice,
  }
});

export default store;