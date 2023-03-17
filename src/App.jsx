import React, { useEffect, useState } from 'react'
import './App.css'
import './styles/modal.css'
import shell from './assets/shell.png'
import mastercard from './assets/mastercard.png'
import { icons } from './assets/icons';
import { RavenButton, RavenInputField, RavenModal } from 'raven-bank-ui'
import spinner from "./assets/spinner.png"
import "raven-bank-ui/dist/esm/styles/index.css"
import  {PinField} from 'react-pin-field'
import ReactPinField from 'react-pin-field'

import mCard from "./assets/mastercard.png"
import Countdown from './helpers/coutdown';
import ErrorModal from './modal/ErrorModal'
function App() {

  // begin masking function
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [moreOptions, setMoreOptions] = useState(false)
  const [stage, setStage] = useState('main')
  const [pinVal, onChange] = useState('')
  const [pin, onComplete] = useState('')
  const [errorModal, onModalCancel] = useState(false)
  const [success, onSuccess] = useState(false)
  const [completePin, setCompletePin] = useState(false)
  const [callbackUrl, setCallbackUrl] = useState('')
  //always reset value on select change
  useEffect(() => {
    if(paymentMethod !== 'card'){
      setCardNumber('')
      setExpiryDate('')
      setCvv('')
    }
  }, [paymentMethod])

  const navigate = (e) => {
    window.location.href = e
  } 
  

  

  function handleCardNumberChange(event) {
    // Get the input value without spaces
    const rawValue = event.target.value.replace(/\s/g, '');

    // Add spaces to create groups of 4 digits
    const maskedValue = rawValue.replace(/(\d{1,4})/g, '$1 ').trim();

    // Set the input value to the masked version
    setCardNumber(maskedValue);
  }

  function handleExpiryDateChange(event) {
    // Get the input value without slashes
    const rawValue = event.target.value.replace(/\//g, '');

    // Add slash after the first two digits
    const maskedValue = rawValue.replace(/^(\d{1,2})/, '$1/').substr(0, 7);

    // Set the input value to the masked version
    setExpiryDate(maskedValue);
  }

  function handleCvvChange(event) {
    // Get the input value without spaces
    const rawValue = event.target.value.replace(/\s/g, '');

    // Replace all digits with asterisks except the last 4
    const maskedValue = rawValue.replace(/\d(?=\d{3})/g, '*');

    // Set the input value to the masked version
    setCvv(maskedValue);
  }

  // retrieve callback url
  const params = new URLSearchParams(window.location.search)

  useEffect(() => {
    if (params.has('cb') ) {
      setCallbackUrl(params.get('cb'))
    } 
  }, [])
  

  return (
    <div className="raven_webpay_wrapper">

      {!success ? 
      <div className='modal_wrapper_container'>
        <div onClick={() => onModalCancel(true)} className="close_btn">
          <figure>
            {icons.close}
          </figure>
        </div>

        <div className="modal_wrapper">
          {/* Header starts here */}
          <div className="header_main_container">
          <div className="header">
            <div className="header_details">
              <p className='business_email'>tayoolakunle@gmail.com</p>
              <span className='payment_amount'>
              <p>Pay</p>
              <h5>NGN 5,848.00</h5>
            </span>
            </div>
            <div className="business_logo">
              <img src={shell} alt="business_logo" />
            </div>
          </div>
          <p>{stage === "main" ? "Select Payment Method" : <span onClick = {() => {
            stage === "pin" ? setStage("main") : stage === "confirming-transaction" ? setStage("pin") : ''
          }} 
          className='back-icon'>
            <figure>{icons.back}</figure> 
            Back</span> 
            }
            </p>

          </div>
       
          {/* Header ends here */}

          {/* Payment method starts here */}
          {stage === 'main' &&
          <div className="payment_method_wrapper">

            <div onClick={() => setPaymentMethod('card')} className={`option_wrapper ${paymentMethod === "card" && 'selected'}`}>
            <div className="option_title_contain">
            <div className="option">
             <figure className="radio">
              {paymentMethod === 'card' ? icons.checked : icons.check}
             </figure>
             <p>Credit Card(Mastercard)</p>
            </div>
            <div className={`option_icon ${paymentMethod === 'card' && 'selected'}`}>
             <figure>
              {icons.transfer}
              </figure>
            </div>
            </div>

              {/* Card input starts here */}
              <div className={`form-group card-input-wrapper ${paymentMethod === 'card' && 'show'}`}>
              <div className="input_group card-input">
                <label className="form-label" htmlFor='card-number'>Card Number</label>
                <input placeholder='0000 0000 0000 0000' className="form-input" name="card-number" id="card-number" maxlength="19" autocomplete="cc-number" value={cardNumber} onChange={handleCardNumberChange}/>
              </div>

              <div className="grouped-input card-input-end">
              <div className="input_group">
                <label className="form-label" htmlFor='card-number'>Expiration date</label>
                <input placeholder='MM/YY' className="form-input" name="exp" id="exp" maxlength="7" autocomplete="cc-exp" value={expiryDate} onChange={handleExpiryDateChange}/>
              </div>
              <div className="input_group ">
                <div className="form-label" htmlFor='card-number'>
                  Security code
                <span className="label-span what-this">
                Whats this ?
                </span>
                  </div>
                <input placeholder='CVV' className="form-input" name="cvv" id="cvv" maxlength="4" autocomplete="cc-csc" value={cvv} onChange={handleCvvChange}/>
              </div>
              </div>

            </div>
            {/* Card input ends here */}

   
            </div>

            <div onClick={() => setPaymentMethod('transfer')} className={`option_wrapper ${paymentMethod === "transfer" && 'selected'}`}>
            <div className="option_title_contain">
            <div className="option">
            <figure className="radio">
            {paymentMethod === 'transfer' ? icons.checked : icons.check}
             </figure>
             <p>Transfers</p>
            </div>
            <div className={`option_icon ${paymentMethod === 'transfer' && 'selected'}`}>
              <figure>
              {icons.transfer}
              </figure>
            </div>
            </div>

            <div className={`payment_option_container ${paymentMethod === 'transfer' && 'show'}`}>
            <div className="payment_details_wrapper">
              <div className="note">Make a single Transfer to this account before it expires.</div>

              <div className="main_details">
                <span className="bank_name">Wema Bank</span>
                <div className="account_number">
                  <p>0121559651</p>
                  <figure className='copy_icon'>
                    {icons.copy}
                  </figure>
                </div>
                <p className="account_name">
                Raven Pay Limited
                </p>
              </div>

              <div className="expiry_period">
                <figure>
                  {icons.clock}
                </figure>
                <p>Account Expires in 14 minutes 56 seconds</p>
              </div>
            </div>
            </div>
            </div>

            <div onClick={() => setPaymentMethod('raven')} className={`option_wrapper ${paymentMethod === "raven" && 'selected'}`}>
            <div className="option_title_contain">
            <div className="option">
            <figure className="radio">
            {paymentMethod === 'raven' ? icons.checked : icons.check}
             </figure>
             <p>Raven Pay</p>
            </div>
            <div className={`option_icon ${paymentMethod === 'raven' && 'selected'}`}>
            <figure>
              {icons.ravenpay}
              </figure>
             </div>
            </div>

            <div className={`payment_option_container ${paymentMethod === 'raven' && 'show'}`}>
                <div className="raven_details_wrapper">
                <div className="form-group">
                <div className="input_group">
                <div className="form-label" >
                Raven Username
                <span className='label-span verify'>VERIFY</span>
                </div>
                <input placeholder='e.g @monalito' className="form-input" name="raven-username" id="username" />
              </div>
                </div>

                <div className="verified_name">
                  Olakunle Temitayo
                </div>
                </div>
            </div>
            </div>

            <div className={`other_options ${moreOptions && 'show'}`}>
              
            <div onClick={() => setPaymentMethod('qr')} className={`option_wrapper ${paymentMethod === "qr" && 'selected'}`}>
            <div className="option_title_contain">
            <div className="option">
            <figure className="radio">
            {paymentMethod === 'qr' ? icons.checked : icons.check}
             </figure>
             <p>QR Code Pay</p>
            </div>
            <div className={`option_icon ${paymentMethod === 'qr' && 'selected'}`}>
             <figure>
              {icons.qr}
              </figure>
            </div>
            </div>

            <div className={`payment_option_container ${paymentMethod === 'qr' && 'show'}`}>
            <div className="payment_details_wrapper">
              <div className="note">Scan the QR code below in your bank mobile app that supports NQR to complete the payment.</div>

              <div className="main_details">
                <div className="qr_code">
                  <figure>
                    {icons.qr_code}
                  </figure>
                </div>
              </div>
            </div>
            </div>

            </div>

            <div onClick={() => setPaymentMethod('ussd')} className={`option_wrapper ${paymentMethod === "ussd" && 'selected'}`}>
            <div className="option_title_contain">
            <div className="option">
            <figure className="radio">
            {paymentMethod === 'ussd' ? icons.checked : icons.check}
             </figure>
             <p>USSD Pay</p>
            </div>
            <div className={`option_icon ${paymentMethod === 'ussd' && 'selected'}`}>
            <figure>
              {icons.ussd}
              </figure>
             </div>
            </div>

            <div className={`payment_option_container ${paymentMethod === 'ussd' && 'show'}`}>
                <div className="ussd_container">
                <div className="form-group">
                <div className="input_group">
                <label className="form-label" >
                Choose your preferred bank
                </label>
                <input placeholder='Select Bank' className="form-input" name="raven-username" id="username" />
              </div>
                </div>

                <div className="payment_details_wrapper">
              <div className="note">Copy the USSD Code and proceed to pay.</div>

              <div className="main_details">
                <div className="account_number">
                  <p>*737*1*67000*4#</p>
                </div>
              
              </div>
            </div>                 
                </div>
              </div>
            </div>            
            </div>

            <div style={{display: moreOptions && 'none'}} onClick={() => setMoreOptions(!moreOptions)} className="more_options_toggle">
              <figure>
                {!moreOptions ? icons.plus : ""}
              </figure>
              <p>
              {!moreOptions ? 'Other Payment methods' :  ''}
              </p>
            </div>


          
          </div>
          }
          {/* Payment method ends here */}

          {/* Confirming Transfer starts here */}
          {stage === 'confirming-transaction' && 
          <div className="confirming_transfer_wrapper">

          <p className="confirm_text">We are confirming your transaction, please hold on.</p>

          <figure className='spinner'>
            <img src={spinner} alt="" />
          </figure>

          <div className="note">Please wait for <Countdown
                // count={(e) => setTimeOut(e === "00:00" ? true : false)} 
                // countDownTime={3000}
              /> minutes</div>

        </div>
          }
          {/* Confirming Transfer starts here */}

          {/* start the pin stage */}
          {stage === 'pin' &&
           <div className="pin_session_wrapper">
            
            <div className="method_summary">
              <figure>
                <img src={mCard} alt="" />
              </figure>

              <div className="method_details">

                <h6>{paymentMethod === 'card' ? "•••• •••• •••• 6534" : "Adeeko Emmanuel"} </h6>
                <span>
                  {paymentMethod === 'card' ? <>
                  <p>Expiry date: 02/24</p>
                  <p>CVV: ***</p>
                  </>
                  
                  : 
                  <p>Raven Bank  •  <b>@teeymix</b></p>
                  }
                </span>
              </div>
            </div>

            <div className="otp_info">
              <p>An otp is required to complete this transaction, check your phone to  retrieve your Otp WITH THE NUMBER REGISTERED WITH THIS CARD.</p>
            </div>

              {/* OTP starts here */}
            <div
        // style={style}
        className={`form-group form-group__black-light`}
      >
          <label htmlFor="" className="form-label">
            {"Enter Security Code"}{" "}
          </label>
        {/* pin group start */}
        <div className={`pin-group pin-group_black-light`}>
          <div
            style={{ gridTemplateColumns: `repeat(6, 1fr)` }}
            className={`pin_field_group`}
          >
            <ReactPinField
              type={`password`}
              length={6 || 6}
              className={`${`pin_field pin_field_black-light`} ${
                completePin && "pin_field_completed"
              }`}
              onChange={(num) => {
                setCompletePin(false);
                onChange(num);
              }}
              onComplete={(num) => {
                onComplete(num);
                setCompletePin(true);
              }}
              format={(k) => k.toUpperCase()}
              //  disabled={showTime}
              validate="0123456789"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              // ref={ref}
            />
          </div>
          {/* count down start */}
          {/* {showCountDown && (
            <div className="count-down-box">
              <p className="text">{timeOut ? "Time out" : "Code expires in"}</p>
             
             <p className="count">
             <Countdown
                count={(e) => setTimeOut(e === "00:00" ? true : false)} 
                countDownTime={countDownTime}
              />
             </p>
              
            </div>
          )} */}

          {/* count down end */}
        </div>
        {/* pin group end */}
      </div>
          </div>
          }
          {/* end pin stage */}


          {/* Failed Trans starts here */}
          {stage === 'failed-transaction' && 
          <div className="failed_transaction_wrapper">
          <figure className=''>
            {icons.failed}
          </figure>

          <span>
          <p className="">Unable to process Payment</p>
          <p className="confirm_text">Seems the details entered is not correct, change the payment method and retry</p>
          </span>


        </div>
          }
          {/* Failed Trans starts here */}

          {/* Payment btn wrap */}
          <div  className="payment_btn">
            <RavenButton disabled={ stage === "pin" && pinVal.length !== 6} 
            label={paymentMethod !== "transfer" && stage !== "failed-transaction" ? `Pay NGN 5000` :  stage === "failed-transaction" ? "Change payment method" : "I have sent the money"}
            color="green-light"
            className='pay_btn'
            onClick={() => {stage === 'main' ? setStage('pin') : stage === "pin" ? setStage('confirming-transaction') :  setStage('failed-transaction')}}
            width="100%"
            />
          </div>
          {/* End Payment btn wrap */}
          
        </div>

        <div className="secured_by">
         {icons.securedBy}
        </div>
      </div>

      : 

      <div className="success_wrapper">

      </div>
}

     <RavenModal
     color="black-light"
     visble={errorModal}
     onClose={() => onModalCancel(false)}
     >
      <ErrorModal 
      bigText={"Are you sure you want to cancel this transaction ?"}
      smallText={"If you cancel this transaction you will be redirected to your previous page and this transaction will fail, do you want to proceed ?"}
      btnText={"No, Continue"}
      onClick = {() => navigate(callbackUrl)}
      onCancel={() => onModalCancel(false)}
      />
     </RavenModal>
    </div>
  )
}

export default App
