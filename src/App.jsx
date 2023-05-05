import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import './styles/modal.css'
import './styles/index.css'

// import shell from './assets/shell.png'
import { icons } from './assets/icons'
import { RavenButton, RavenInputField, RavenModal, RavenToolTip } from 'raven-bank-ui'
import spinner from './assets/spinner.png'
// import logo_icon from './assets/logo_icon.svg'
import 'raven-bank-ui/dist/esm/styles/index.css'
import ReactPinField from 'react-pin-field'
import limitless from './assets/limitless.png'
import mCard from './assets/mastercard.png'
import Countdown from './helpers/coutdown'
import ErrorModal from './modal/ErrorModal'
import { FaCheckCircle } from '../node_modules/react-icons/fa/index.esm'
import { useDispatch, useSelector } from 'react-redux'
import {
  getPaymentConfig,
  initiateCardTransaction,
  initiate3dsTransaction,
  getBankAccount,
  confirmTransfer,
  initiateUssdPayment,
  getUssdCode,
  verifyCardTrx,
  initRavenPay,
  processCardToken,
} from './redux/payment'
import { formatNumWithCommaNaira, generateReference } from './helpers/helpers'
import parse from 'html-react-parser'

function App() {
  const dispatch = useDispatch()

  //enable cross-platform communication with sdks and plugins
  function postMessage(type, message) {
    window.parent.postMessage({ type: type, message: message }, '*')
  }

  //custom javascript sleep function
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  let int
  // retrieve redux states
  const {
    config,
    loading,
    bank,
    raven_pay,
    card_ref,
    card_transaction_status,
    transferStatus,
    isUssdLoading,
    ussd_details,
    ussd_code,
  } = useSelector((state) => state.payment)

  // aliases for constanst and states
  let prefferedGateway = config?.payment_methods
  //end aliases for constanst and states

  // retrieve plugin based configurations
  const params = new URLSearchParams(location.search)
  const platform = params.get('platform')
  const supportedPlatform = platform === ('wordpress' || 'joomla' || 'magento' || 'atlas' || 'banking') ? true : false
  // end plugin configuration

  // begin masking function
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvv, setCvv] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
  // const [moreOptions, setMoreOptions] = useState(prefferedGateway?.length > 4 ? false : true)
  const [stage, setStage] = useState('main')
  const [pinVal, onPinChange] = useState('')
  const [pin, onComplete] = useState('')
  const [errorModal, onModalCancel] = useState(false)
  const [success, setSuccess] = useState(false)
  const [completePin, setCompletePin] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [ussd, setussd] = useState(null)
  const [count, setCount] = useState(null)
  const [externalView, setExternalView] = useState(false)
  const [viewFrame, setViewFrame] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copy2, setCopy2] = useState(false)
  const [cardType, setCardType] = useState(null)
  const [inlineRef, setInlineRef] = useState(null)
  const [closed, setClosed] = useState(false)
  const [mode, setMode] = useState(null)
  const [cardUserRef, setCardUserRef] = useState(null)

  // programmatically inject the app to document body

  const inject = () => {
    const ravenpaydiv = document.createElement('div')
    ravenpaydiv.id = 'raven_webpay_wrapper'
    document.body.appendChild(ravenpaydiv)
  }

  //always reset value on select change
  useEffect(() => {
    if (paymentMethod !== 'card') {
      setCardNumber('')
      setExpiryDate('')
      setCvv('')
    }
  }, [paymentMethod])

  const navigate = (e) => {
    window.location.href = e
  }

  const handleCopy = async (e) => {
    await navigator.clipboard.writeText(e)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 800)
  }

  const handleCopy2 = async (e) => {
    await navigator.clipboard.writeText(e)
    setCopy2(true)

    setTimeout(() => {
      setCopy2(false)
    }, 800)
  }

  const formatSelectOption = (param) => {
    const list = param?.map((chi) => {
      const { BankName, BankCode, UssdString } = chi
      return {
        label: BankName,
        value: BankCode,
        ussd_code: String(UssdString),
      }
    })
    return list
  }

  //declare a global window object
  window.RavenWebpay = {
    ref: (e) => {
      setInlineRef(e)
      return inlineRef
    },
    success: success,
    closed: closed,
    start: false,
    mode: (e) => {
      setMode(e)
      return e
    },
  }
  // end window object

  // get transaction ref from url
  const ref = window.location.search
  let trx = inlineRef ? inlineRef : ref.split('=')[1]

  const userRef = generateReference()
  // end transaction ref getter

  // function derived from 3ds authentication
  function trigger3ds() {
    var e = document.getElementById('threedsChallengeRedirectForm')
    if (e) {
      e.submit()
      if (e.parentNode !== null) {
        e.parentNode.removeChild(e)
      }
    }
  }

  // end redux state getter

  // handle api calls
  async function getConfig() {
    await dispatch(getPaymentConfig(trx))
    inject()
  }

  async function sendCardToken() {
    let response = await dispatch(
      processCardToken({
        pay_ref: cardUserRef,
        token: pinVal,
      }),
    )

    if (response.payload.status === 'success') {
      setStage('confirming-transaction')
      checkCardTrxStatus(card_ref)
    }
  }

  async function initCardPayment() {
    setCardUserRef(userRef) // save the ref for non 3ds repeated use
    setIsLoading(true)
    const payload = {
      trx_ref: trx,
      currency: 'NGN',
      card_number: cardNumber.replaceAll(' ', ''),
      cvv: cvv,
      expiry_month: expiryDate.split('/')[0],
      expiry_year: expiryDate.split('/')[1],
      pay_ref: userRef,
      pin: pinVal,
    }

    const response = await dispatch(initiateCardTransaction(payload))

    if (response?.payload?.status === 'success') {
      if (response?.payload?.data['3ds_auth']) {
        // load a hidden div that will be part of data response for 21 seconds
        //then send back to server to initiate the transaction

        let divData = response.payload.data.data
        let div = document.createElement('div')

        //make the div hidden
        div.style.display = 'none'
        div.innerHTML = divData
        document.body.appendChild(div)
        //wait for 21 seconds
        let externalPrompt
        // trigger 3ds initialisation
        setIsLoading(true)
        setTimeout(async () => {
          externalPrompt = await dispatch(initiate3dsTransaction({ pay_ref: userRef }))
          setViewFrame(externalPrompt)
        }, 8000)
        //end trigger

        if (viewFrame?.payload?.status === 'success') {
          setIsLoading(true)
        }
      } else setStage('pin')
    } else {
      setIsLoading(false)
    }
  }

  async function retrieveUssdCode(e) {
    await dispatch(getUssdCode({ ref: trx, code: e }))
  }

  // process transfer request
  async function getBank() {
    await dispatch(getBankAccount(trx))
  }

  // document.querySelector('.external_view_wrapper')?.append(viewFrame?.payload?.data?.data);

  const checkTransferStatus = useCallback(
    (success) => {
      clearInterval(int)

      int = setInterval(async () => {
        let call = await dispatch(confirmTransfer(trx))
        if (call?.payload?.data?.status === 'successful') return clearInterval(cardint)
        if (success) return clearInterval(int)
      }, 10000)
    },
    [trx],
  )

  // check card transaction status
  let cardint
  const checkCardTrxStatus = useCallback(
    (card_ref) => {
      clearInterval(cardint)

      cardint = setInterval(
        async (card_ref) => {
          let call = await dispatch(verifyCardTrx(card_ref))
          // console.log(card_ref, ":Pay Ref within useCallback")

          if (call?.payload?.data?.status === 'successful') {
            getConfig()
            setSuccess(true)
          }
          if (call?.payload?.data?.status === 'successful') return clearInterval(cardint)
          if (call?.payload?.data?.status === 'failed') return clearInterval(cardint)
        },
        10000,
        [card_ref],
      )
    },
    [cardRef, card_ref],
  )

  // api calls use effect
  useEffect(() => {
    getConfig()
  }, [])

  // effect calls for transfer
  useEffect(() => {
    if (!bank && paymentMethod === 'transfer') {
      getBank()
    }

    // clear all interval if success is true
    if (success) {
      clearInterval(int)
      clearInterval(cardint)
    }

    if (paymentMethod === 'transfer' && !success) checkTransferStatus(success)
  }, [paymentMethod === 'transfer'])

  useEffect(() => {
    if (paymentMethod === 'ussd' && !success) checkTransferStatus(success)
    if (paymentMethod === 'raven' && !success) checkTransferStatus(success)
  }, [paymentMethod === 'ussd' || paymentMethod === 'raven'])

  useEffect(() => {
    if (paymentMethod === 'raven' && !success) dispatch(initRavenPay(trx))
  }, [paymentMethod === 'raven'])

  // effect calls checking transfer status
  useEffect(() => {
    if (transferStatus.is_paid === 1) {
      getConfig()
      setSuccess(true)
      setPaymentMethod(null)
      clearInterval(int)
    }
  }, [transferStatus])

  // effect calls to init ussd
  useEffect(() => {
    if (paymentMethod === 'ussd') {
      dispatch(initiateUssdPayment(trx))
      //  console.log(ussd_details)
    }
  }, [paymentMethod === 'ussd'])

  // effect call for 3ds authentication
  useEffect(() => {
    setCardRef(viewFrame?.payload?.data?.payment_reference)
    if (viewFrame) {
      setExternalView(true)
      checkCardTrxStatus(card_ref)
      setTimeout(() => {
        trigger3ds()
      }, 500)
    }
  }, [viewFrame])

  useEffect(() => {
    if (card_transaction_status?.data?.status == 'successful') {
      getConfig()
      setSuccess(true)
    }

    if (card_transaction_status?.data?.status == 'failed') {
      setStage('failed-transaction')
      setExternalView(false)
    }
  }, [card_transaction_status, success])

  //effect call for window ref
  useEffect(() => {
    getConfig()
  }, [inlineRef])

  // effect call for cross-platform communication
  useEffect(() => {
    if (success === true) {
      // console.log("Success:", config);
      postMessage('onSuccess', config)
    }
  }, [success])

  //end effects

  // end api calls sections

  function handleCardNumberChange(event) {
    const rawValue = event.target.value.replace(/\s/g, '')
    const maskedValue = rawValue.replace(/(\d{1,4})/g, '$1 ').trim()

    // Detect card type
    if (/^4/.test(rawValue)) {
      setCardType('Visa')
    } else if (/^5[1-5]/.test(rawValue)) {
      setCardType('Mastercard')
    } else if (/^3[47]/.test(rawValue)) {
      setCardType('American Express')
    } else if (/^6(?:011|5)/.test(rawValue)) {
      setCardType('Discover')
    } else if (/^5[6-9]|^506[0-9]|^6500[0-9]/.test(rawValue)) {
      setCardType('Verve')
    } else {
      setCardType(null)
    }

    // Set the input value to the masked version
    setCardNumber(maskedValue)
  }

  function handleExpiryDateChange(event) {
    // Get the input value without slashes
    const rawValue = event.target.value.replace(/\//g, '')

    // Add slash after the first two digits
    const maskedValue = rawValue.replace(/^(\d{1,2})/, '$1/').substr(0, 7)

    // Set the input value to the masked version
    setExpiryDate(maskedValue)
  }

  function handleCvvChange(event) {
    // Get the input value without spaces
    const rawValue = event.target.value.replace(/\s/g, '')

    // Replace all digits with asterisks except the last 3
    const maskedValue = rawValue.replace(/\d(?=\d{3})/g, '*')
    // Set the input value to the masked version
    setCvv(maskedValue)
  }

  // retrieve callback url
  // const params = new URLSearchParams(window.location.search)

  useEffect(() => {
    if (config?.redirect_url !== null)
      setCallbackUrl(
        `${config?.redirect_url}?trx_ref=${config?.trx_ref}&merchant_ref=${config?.merchant_ref}&status=${config?.status}`,
      )
    if (!success) postMessage('onLoad', config)
  }, [config])

  const bankCountDown = () => {
    let min = count?.split(':')[0]
    let sec = count?.split(':')[1]

    return { min, sec }
  }
  const has_keys = Object.keys(config)

  return (
    <div className={`raven_webpay_wrapper ${supportedPlatform && 'modal'}`}>
      <div className='modal_wrapper_container'>
        {!success && (
          <div onClick={() => onModalCancel(true)} className='close_btn'>
            <figure>{icons.close}</figure>
          </div>
        )}

        {!success && (
          <>
            {
              !externalView ? (
                // show normal payment modal if success & external view are not true
                <div className='modal_wrapper'>
                  {/* Header starts here */}
                  <div className='header_main_container'>
                    <div className='header'>
                      <div className='header_details'>
                        <p className='business_email'>{config?.email}</p>
                        <span className='payment_amount'>
                          <p>Pay</p>
                          {has_keys.length > 0 ? <h5>₦{formatNumWithCommaNaira(String(config?.amount))}</h5> : ''}
                        </span>
                      </div>
                      <div onClick={() => setStage('pin')} className='business_logo'>
                        <figure>{icons.logo_icon}</figure>
                        {/* <img src={'https://www.northeastern.edu/graduate/blog/wp-content/uploads/2019/09/iStock-1150384596-2.jpg'} alt='business_logo' /> */}
                      </div>
                    </div>
                  </div>

                  {/* Header ends here */}

                  {/* Payment method starts here */}
                  {stage === 'main' && (
                    <div className='payment_method_wrapper'>
                      {/* Display card payment if preffered */}
                      <div className={`option_wrapper selected `}>
                        {/* Card input starts here */}
                        <div className={`form-group card-input-wrapper ${paymentMethod === 'card' && 'show'}`}>
                          <div className='input_group card-input'>
                            <label className='form-label' htmlFor='card-number'>
                              Card Payment
                            </label>
                            <input
                              placeholder='0000 0000 0000 0000'
                              pattern='[0-9]'
                              className='form-input'
                              name='card-number'
                              id='card-number'
                              maxLength='25'
                              autoComplete='cc-number'
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                            />
                            <div className={cardType === 'Verve' ? 'card_icon verve_card' : `card_icon`}>
                              <figure>
                                {cardType === 'Mastercard'
                                  ? icons.mastercard
                                  : cardType === 'Visa'
                                  ? icons.visa
                                  : cardType === 'Verve'
                                  ? icons.verve
                                  : ''}
                              </figure>
                            </div>
                          </div>

                          <div className='grouped-input card-input-end'>
                            <div className='input_group'>
                              <label className='form-label' htmlFor='card-number'>
                                Expiration date
                              </label>
                              <input
                                placeholder='MM/YY'
                                pattern='[0-9 ]+'
                                className='form-input'
                                name='exp'
                                id='exp'
                                maxLength='5'
                                autoComplete='cc-exp'
                                value={expiryDate}
                                onChange={handleExpiryDateChange}
                              />
                            </div>
                            <div className='input_group '>
                              <div className='form-label' htmlFor='card-number'>
                                Security code
                                <span style={{ zIndex: 500 }} className='label-span what-this tooltip-hover-wrap'>
                                  Whats this ?
                                  <RavenToolTip
                                    text='The CVV/CVC code (Card Verification Value/Code) is located on the back of your credit/debit card on the right side of the white signature strip.'
                                    color={'black-light'}
                                    textColor={'white-light'}
                                    position={'top-left'}
                                  ></RavenToolTip>
                                </span>
                              </div>
                              <input
                                placeholder='CVV'
                                className='form-input'
                                name='cvv'
                                id='cvv'
                                maxLength='3'
                                autoComplete='cc-csc'
                                value={cvv}
                                onChange={handleCvvChange}
                              />
                            </div>
                          </div>
                          {cardType === 'Verve' && (
                            <div className='input_group '>
                              <label className='form-label' htmlFor='card-number'>
                                Card Pin
                              </label>
                              <RavenInputField
                                type='pin'
                                pinFieldNumber={4}
                                color={'green-light'}
                                value={pinVal}
                                onChange={(e) => onPinChange(e)}
                              />
                            </div>
                          )}
                        </div>
                        {/* Card input ends here */}

                        {/* Transfer payment option input */}
                        <div className={`payment_option_container ${paymentMethod === 'transfer' && 'show'}`}>
                          <div className='payment_details_wrapper'>
                            <div className='note'>
                              <b style={{ color: '#EA872D' }}>Bank Transfer:</b> Make a single Transfer to this account
                              before it expires.
                            </div>

                            <div className='main_details'>
                              <span className='bank_name'>{bank?.bank}</span>
                              <div className='account_number'>
                                <p>{bank?.account_number}</p>
                                <figure onClick={() => handleCopy(bank?.account_number)} className='copy_icon'>
                                  {copied ? <FaCheckCircle /> : icons.copy}
                                </figure>
                              </div>
                              <p className='account_name'>{bank?.account_name}</p>
                            </div>

                            <div className='expiry_period'>
                              <figure>{icons.clock}</figure>
                              <div style={{ display: 'none' }}>
                                <Countdown countdownTime={840} count={(d) => setCount(d)} />
                              </div>
                              <p>
                                Account Expires in {bankCountDown().min} minutes {bankCountDown().sec} seconds
                              </p>
                            </div>
                          </div>
                        </div>
                        {/* End payment option input */}

                        {/* Raven pay payment option view */}
                        <div className={`payment_option_container ${paymentMethod === 'raven' && 'show'}`}>
                          <div className='raven_details_wrapper'>
                            {!isLoading && (
                              <div className='payment_details_wrapper'>
                                <div className='note'>
                                  <b style={{ color: '#EA872D' }}>Raven Pay:</b> Tap to see instructions on how to use
                                  Raven Pay {icons.warn}
                                </div>

                                <div className='main_details ravenpay_main_details'>
                                  <div className='account_number raven_username'>
                                    <span className='label'>{'Narration'}</span>
                                    <p>{raven_pay?.raven_pay_ref}</p>
                                    <figure onClick={() => handleCopy(raven_pay?.raven_pay_ref)} className='copy_icon'>
                                      {copied ? <FaCheckCircle /> : icons.copy}
                                    </figure>
                                  </div>

                                  <div className='account_name raven_username'>
                                    <span className='label'>{'Username'}</span>
                                    <p>ravenpay</p>
                                    <figure onClick={() => handleCopy2('ravenpay')}>
                                      {copy2 ? <FaCheckCircle /> : icons.copy}
                                    </figure>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'start' }} className='expiry_period'>
                                  <p>
                                    <b>Note:</b> Make sure you send the exact amount, whilst using the narration
                                    provided above.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* end ravenpay view */}

                        {/* qr pay view */}
                        <div className={`payment_option_container ${paymentMethod === 'qr' && 'show'}`}>
                          <div className='payment_details_wrapper'>
                            <div className='note'>
                              Scan the QR code below in your bank mobile app that supports NQR to complete the payment.
                            </div>

                            <div className='main_details'>
                              <div className='qr_code'>
                                <figure>{icons.qr_code}</figure>
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* end qr pay view */}

                        {/* ussd pay view */}
                        <div className={`payment_option_container ${paymentMethod === 'ussd' && 'show'}`}>
                          <div className='ussd_container'>
                            <div style={{ marginBottom: '1rem' }}>
                              <RavenInputField
                                label='Select preffered bank'
                                color='light'
                                type='select'
                                placeholder='Select Bank'
                                name='bank'
                                onChange={(e) => {
                                  setussd(e)
                                  retrieveUssdCode(e?.value)
                                }}
                                // menuPlacement={'top'}
                                style={{ zIndex: '10000', position: 'relative' }}
                                selectOption={formatSelectOption(ussd_details?.bank_list)}
                                id='bank'
                              />
                            </div>

                            {ussd && !isUssdLoading && (
                              <div className='payment_details_wrapper'>
                                <div className='note'>
                                  <b style={{ color: '#EA872D' }}>USSD:</b> Copy the USSD code to your keypad and start
                                  your transaction
                                </div>
                                <div className='main_details'>
                                  <div className='account_number raven_username'>
                                    <span className='label'>{'USSD Code'}</span>
                                    <p>{ussd_code?.ussd_string}</p>
                                    <figure onClick={() => handleCopy(ussd_code?.ussd_string)} className='copy_icon'>
                                      {copied ? <FaCheckCircle /> : icons.copy}
                                    </figure>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'start' }} className='expiry_period'>
                                  <p>
                                    <b>Note:</b> If you have any issues with your transactions{' '}
                                    <b style={{ color: '#0B8376' }}>please contact support.</b>
                                  </p>
                                </div>
                              </div>
                            )}

                            {isUssdLoading && (
                              <div className='spinner_contain'>
                                <figure className='spinner'>
                                  <img src={spinner} alt='' />
                                </figure>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* end ussd pay view */}

                        {/* Payment btn wrap */}
                        <div className='payment_btn'>
                          <RavenButton
                            disabled={
                              (stage === 'pin' && pinVal.length !== 6) ||
                              stage === 'confirming-transaction' ||
                              (stage === 'main' &&
                                paymentMethod === 'card' &&
                                (cvv.length < 2 || cardNumber.length < 8 || expiryDate.length < 3))
                            }
                            loading={loading || isLoading}
                            label={
                              stage === 'confirming-transaction'
                                ? 'Confirming Transaction'
                                : paymentMethod === 'raven' && stage === 'main'
                                ? 'I have sent the  money'
                                : paymentMethod !== 'transfer' && stage !== 'failed-transaction'
                                ? `Pay  ₦${formatNumWithCommaNaira(String(config?.amount))}`
                                : stage === 'failed-transaction'
                                ? 'Change payment method'
                                : 'I have sent the money'
                            }
                            color='green-light'
                            className='pay_btn'
                            onClick={() => {
                              success
                                ? navigate(callbackUrl)
                                : paymentMethod === 'raven' && stage === 'main'
                                ? setStage('confirming-transaction')
                                : stage === 'main' && paymentMethod === 'card'
                                ? initCardPayment()
                                : stage === 'main' && paymentMethod === 'transfer'
                                ? setStage('confirming-transaction')
                                : ''
                            }}
                            // size="medium"
                            width='100%'
                          />
                        </div>
                        {/* End Payment btn wrap */}
                      </div>
                      {/* Display card payment  */}

                      <div className='payment_select_option'>
                        <p className='select_option_title'>SELECT PAYMENT OPTION</p>

                        <div className='options_wrapper'>
                          {prefferedGateway?.includes('card') && paymentMethod !== 'card' && (
                            <div className='options' onClick={() => setPaymentMethod('card')}>
                              <figure>{icons.credit_card}</figure>
                              <p>Card Payment</p>
                            </div>
                          )}

                          {prefferedGateway?.includes('bank_transfer') && paymentMethod !== 'transfer' && (
                            <div className='options' onClick={() => setPaymentMethod('transfer')}>
                              <figure>{icons.transfer}</figure>
                              <p>Bank Transfer</p>
                            </div>
                          )}

                          {prefferedGateway?.includes('raven') && paymentMethod !== 'raven' && (
                            <div className='options' onClick={() => setPaymentMethod('raven')}>
                              <figure>{icons.ravenpay}</figure>
                              <p>Raven Pay</p>
                            </div>
                          )}

                          {prefferedGateway?.includes('qr') && paymentMethod !== 'qr' && (
                            <div className='options' onClick={() => setPaymentMethod('qr')}>
                              <figure>{icons.qr}</figure>
                              <p>NQR Payment</p>
                            </div>
                          )}

                          {prefferedGateway?.includes('ussd') && paymentMethod !== 'ussd' && (
                            <div className='options' onClick={() => setPaymentMethod('ussd')}>
                              <figure>{icons.ussd}</figure>
                              <p>USSD Payment</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Payment method ends here */}

                  {/* Confirming Transfer starts here */}
                  {stage === 'confirming-transaction' && (
                    <div className='confirming_transfer_wrapper'>
                      <p className='confirm_text'>We are confirming your transaction, please hold on.</p>

                      <figure className='spinner'>
                        <img src={spinner} alt='' />
                      </figure>

                      <div className='note'>
                        Please wait for{' '}
                        <Countdown
                        // count={(e) => setTimeOut(e === "00:00" ? true : false)}
                        // countDownTime={3000}
                        />{' '}
                        minutes
                      </div>

                      <div className='contact_support_msg'>
                        <p>
                          If you have any issues with your transactions{' '}
                          <b style={{ color: '#755AE2' }}>please contact support.</b>
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Confirming Transfer starts here */}

                  {/* start the pin stage */}
                  {stage === 'pin' && (
                    <div className='pin_session_wrapper'>
                      <div className='method_summary'>
                        <figure>{icons.verve}</figure>

                        <div className='method_details'>
                          <h6>
                            {paymentMethod === 'card' ? `•••• •••• •••• ${cardNumber.slice(-4)}` : 'Adeeko Emmanuel'}{' '}
                          </h6>
                          <span>
                            {paymentMethod === 'card' ? (
                              <>
                                <p>Expiry date: 02/24</p>
                                <p>CVV: ***</p>
                              </>
                            ) : (
                              <p>
                                Raven Bank • <b>@teeymix</b>
                              </p>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className='otp_info'>
                        <p>
                          An otp is required to complete this transaction, check your phone to retrieve your Otp WITH
                          THE NUMBER REGISTERED WITH THIS CARD.
                        </p>
                      </div>

                      {/* OTP starts here */}
                      <div
                        // style={style}
                        className={`form-group form-group__black-light`}
                      >
                        <label htmlFor='' className='form-label'>
                          {'Enter Security Code'}{' '}
                        </label>
                        {/* pin group start */}
                        <div className={`pin-group pin-group_black-light`}>
                          <div style={{ gridTemplateColumns: `repeat(6, 1fr)` }} className={`pin_field_group`}>
                            <ReactPinField
                              type={`password`}
                              length={6 || 6}
                              className={`${`pin_field pin_field_black-light`} ${completePin && 'pin_field_completed'}`}
                              onChange={(num) => {
                                setCompletePin(false)
                                onPinChange(num)
                              }}
                              onComplete={(num) => {
                                onComplete(num)
                                setCompletePin(true)
                              }}
                              format={(k) => k.toUpperCase()}
                              //  disabled={showTime}
                              validate='0123456789'
                              autoFocus
                              // ref={ref}
                            />
                          </div>

                          {/* count down start */}

                          <div>
                            <div className='note pin-note'>
                              Code expires in{' '}
                              <Countdown
                              // count={(e) => setTimeOut(e === "00:00" ? true : false)}
                              // countDownTime={3000}
                              />{' '}
                              minutes
                            </div>
                          </div>

                          {/* count down end */}
                        </div>
                        {/* pin group end */}
                      </div>

                      {/* Button Action */}
                      <div className='pin-btn-wrapper'>
                        <RavenButton
                          disabled={stage === 'pin' && pinVal.length !== 6}
                          className='pin-btn'
                          name='card-pin'
                          color={'green-light'}
                          loading={loading}
                          onClick={sendCardToken}
                          label='Confirm PIN'
                          // size={"small"}
                        />
                      </div>
                    </div>
                  )}
                  {/* end pin stage */}

                  {/* Failed Trans starts here */}
                  {stage === 'failed-transaction' && (
                    <div className='failed_transaction_wrapper'>
                      <figure className=''>{icons.failed}</figure>

                      <span>
                        <p className=''>Unable to process Payment</p>
                        <p className='confirm_text'>
                          Seems the details entered is not correct, change the payment method and retry
                        </p>
                      </span>
                    </div>
                  )}
                  {/* Failed Trans ends here */}
                </div>
              ) : (
                // end show normal payment modaal

                // show external view if true
                <div className='external_view_wrapper modal_wrapper'>{parse(viewFrame?.payload?.data?.data)}</div>
              )

              // end show external view if true
            }
          </>
        )}

        {/* // show success modal if trx successful */}
        {success && (
          <div className='success_wrapper'>
            <div className='success_message'>
              <figure>
                <img src={limitless} alt='Limitless' />
              </figure>
              <div className='text'>
                <h6>Transaction Successful</h6>

                <span>
                  <p>You have successfully paid N{config?.amount} to,</p>
                  <p>
                    <b>{config?.email}</b>
                  </p>
                </span>
              </div>
            </div>

            <div className='button_wrapper'>
              <RavenButton
                className='btn-outline-white-light success_btn'
                onClick={() => {
                  postMessage('onclose', 'transaction_success', config), navigate(callbackUrl)
                }}
                label='Close Payment'
              />
            </div>
          </div>
        )}
        {/*  // end show success modal if trx successful */}

        {!success && <div className='secured_by'>{icons.securedBy}</div>}
      </div>

      <RavenModal color='black-light' visble={errorModal} onClose={() => onModalCancel(false)}>
        <ErrorModal
          bigText={'Cancel Payment'}
          smallText={'Are you sure you want to cancel this payment request, please confirm before proceeding.'}
          btnText={'Close modal'}
          onClick={() => {
            postMessage('onclose', 'Payment window closed'), setClosed(true), navigate(callbackUrl)
          }}
          onCancel={() => onModalCancel(false)}
        />
      </RavenModal>
    </div>
  )
}

export default App
