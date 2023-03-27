import { configureStore } from "@reduxjs/toolkit";
import payment from './payment.js'
const initialState = {};
const store = configureStore({
  reducer: {
    payment,
  },
});

export default store;
