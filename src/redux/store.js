import { configureStore } from '@reduxjs/toolkit'
import payment from './payment.js'

const store = configureStore({
  reducer: {
    payment,
  },
})

export default store
