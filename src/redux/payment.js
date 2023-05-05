import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'raven-bank-ui'
import api from '../helpers/axios'

export const getPaymentConfig = createAsyncThunk('/get_payment_config', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`webpay/web/get_payment?trx_ref=${payload}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setConfig(data?.data?.data))
    } else {
      toast.error('Something went wrong fetching this payment data')
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const confirmTransfer = createAsyncThunk('/get_payment_config', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`webpay/web/get_payment?trx_ref=${payload}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setTransferStatus(data?.data?.data))
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const initiateCardTransaction = createAsyncThunk('/get_payment_config', async (payload, thunkAPI) => {
  try {
    const data = await api.post('/webpay/web/initiate_card_transaction', payload)

    if (data?.data?.status === 'success') {
      // await thunkAPI.dispatch(setConfig(data?.data?.data));
      await thunkAPI.dispatch(setCardRef(data?.data?.data?.payment_reference))
    } else {
      toast.error('Unable to initiate card transaction, please try again')
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const processCardToken = createAsyncThunk('/init_3ds_transaction', async (payload, _thunkAPI) => {
  try {
    const data = await api.post('/webpay/web/verify_card_token', payload)

    if (data?.data?.status === 'success') {
      // await thunkAPI.dispatch(setCardRef(data?.data?.data?.payment_reference))
    } else {
      toast.error("We couldn't process your token, token is expired or invalid")
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const initiate3dsTransaction = createAsyncThunk('/init_3ds_transaction', async (payload, thunkAPI) => {
  try {
    const data = await api.post('/webpay/web/initiate_card_transaction_3ds', payload)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setCardRef(data?.data?.data?.payment_reference))
    } else {
      toast.error('Unable to initiate card transaction, please try again')
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const getBankAccount = createAsyncThunk('/get_bank_account', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`/webpay/web/get_bank_account?trx_ref=${payload}`)
    // console.log(data, 'transfer')
    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setAccountNo(data?.data?.data))
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const initiateUssdPayment = createAsyncThunk('/initiate_ussd_payment', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`/webpay/web/get_ussd_reference?trx_ref=${payload}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setUssdDetails(data?.data?.data))
    } else {
      toast.error('An error occurred, please try again')
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const getUssdCode = createAsyncThunk('/initiate_ussd_payment', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`webpay/web/get_ussd_string?trx_ref=${payload.ref}&bank_code=${payload.code}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setUssd(data?.data?.data))
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const verifyCardTrx = createAsyncThunk('/verify_card_transaction', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`/webpay/web/verify_card_transaction?payment_reference=${payload}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setCardTransactionStatus(data?.data))
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const initRavenPay = createAsyncThunk('/verify_card_transaction', async (payload, thunkAPI) => {
  try {
    const data = await api.get(`webpay/web/get_pay_with_raven_ref?trx_ref=${payload}`)

    if (data?.data?.status === 'success') {
      await thunkAPI.dispatch(setRavenPayStatus(data?.data?.data))
    } else {
      toast.error('Something went wrong, please try again')
    }
    return data?.data
  } catch (error) {
    console.log(error)
  }
})

export const payment = createSlice({
  name: 'payment',
  initialState: {
    config: {},
    loading: false,
    isTransferLoading: false,
    transferStatus: {},
    ussd_code: {},
    isUssdLoading: false,
    ussd_details: {},
    card_ref: null,
    card_trx: [],
    raven_pay: {},
    bank: null,
  },
  reducers: {
    setConfig: (state, action) => {
      state.config = action.payload
      state.isAuth = true
    },

    setAccountNo: (state, action) => {
      state.bank = action.payload
      state.isAuth = true
    },

    setTransferStatus: (state, action) => {
      ;(state.transferStatus = action.payload), (state.isAuth = false)
    },

    setCardTransactionStatus: (state, action) => {
      ;(state.card_transaction_status = action.payload), (state.isAuth = false)
    },

    setUssdDetails: (state, action) => {
      ;(state.ussd_details = action.payload), (state.isAuth = false)
    },

    setUssd: (state, action) => {
      ;(state.ussd_code = action.payload), (state.isAuth = false)
    },

    setCardRef: (state, action) => {
      ;(state.card_ref = action.payload), (state.isAuth = false)
    },

    setRavenPayStatus: (state, action) => {
      ;(state.raven_pay = action.payload), (state.isAuth = false)
    },
  },

  extraReducers: {
    [getPaymentConfig.pending]: (state) => {
      state.loading = true
    },
    [getPaymentConfig.fulfilled]: (state) => {
      state.loading = false
    },
    [getPaymentConfig.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [confirmTransfer.pending]: (state) => {
      state.isTransferLoading = true
    },
    [confirmTransfer.fulfilled]: (state) => {
      state.isTransferLoading = false
    },
    [confirmTransfer.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.isTransferLoading = false
      state.isAuth = false
      state = null
    },

    // [initiateCardTransaction.pending]: (state) => {
    //   state.loading = true;
    // },
    // [initiateCardTransaction.fulfilled]: (state) => {
    //   state.loading = false;
    // },
    // [initiateCardTransaction.rejected]: (state) => {
    //   // localStorage.removeItem("token");
    //   state.loading = false;
    //   state.isAuth = false;
    //   state = null;
    // },

    [initiate3dsTransaction.pending]: (state) => {
      state.loading = true
    },
    [initiate3dsTransaction.fulfilled]: (state) => {
      state.loading = false
    },
    [initiate3dsTransaction.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [initiateCardTransaction.pending]: (state) => {
      state.loading = true
    },
    [initiateCardTransaction.fulfilled]: (state) => {
      state.loading = false
    },
    [initiateCardTransaction.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [getBankAccount.pending]: (state) => {
      state.loading = true
    },
    [getBankAccount.fulfilled]: (state) => {
      state.loading = false
    },
    [getBankAccount.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [initiateUssdPayment.pending]: (state) => {
      state.loading = true
    },
    [initiateUssdPayment.fulfilled]: (state) => {
      state.loading = false
    },
    [initiateUssdPayment.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [processCardToken.pending]: (state) => {
      state.loading = true
    },
    [processCardToken.fulfilled]: (state) => {
      state.loading = false
    },
    [processCardToken.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.loading = false
      state.isAuth = false
      state = null
    },

    [getUssdCode.pending]: (state) => {
      state.isUssdLoading = true
    },
    [getUssdCode.fulfilled]: (state) => {
      state.isUssdLoading = false
    },
    [getUssdCode.rejected]: (state) => {
      // localStorage.removeItem("token");
      state.isUssdLoading = false
      state.isAuth = false
      state = null
    },
  },
})

export const {
  setConfig,
  setAccountNo,
  setCardRef,
  setRavenPayStatus,
  setCardTransactionStatus,
  setUssdDetails,
  setUssd,
  setTransferStatus,
} = payment.actions

export default payment.reducer
