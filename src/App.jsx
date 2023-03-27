import React, { useCallback, useEffect, useState } from 'react'
import './App.css'
import './styles/modal.css'
import shell from './assets/shell.png'
import { icons } from './assets/icons';
import { RavenButton, RavenInputField, RavenModal } from 'raven-bank-ui'
import spinner from "./assets/spinner.png"
import "raven-bank-ui/dist/esm/styles/index.css"
import ReactPinField from 'react-pin-field'
import limitless from "./assets/limitless.png"
import mCard from "./assets/mastercard.png"
import Countdown from './helpers/coutdown';
import ErrorModal from './modal/ErrorModal'
import { FaCheckCircle } from '../node_modules/react-icons/fa/index.esm';
import { useDispatch, useSelector } from 'react-redux';
import { getPaymentConfig, initiateCardTransaction, initiate3dsTransaction, getBankAccount, confirmTransfer, initiateUssdPayment, getUssdCode, verifyCardTrx, initRavenPay } from './redux/payment';
import { generateReference } from './helpers/helpers';
import parse from 'html-react-parser';

function App() {

  const dispatch = useDispatch()
  let int;

// retrieve redux states
const { config, loading, bank, raven_pay, card_ref, card_transaction_status, transferStatus, isUssdLoading, ussd_details, ussd_code } = useSelector((state) => state.payment);

  // aliases for constanst and states
  let prefferedGateway = config?.payment_methods

  //end aliases for constanst and states

  // begin masking function
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [moreOptions, setMoreOptions] = useState(prefferedGateway?.length > 4 ? false : true)
  const [stage, setStage] = useState('main')
  const [pinVal, onChange] = useState('')
  const [pin, onComplete] = useState('')
  const [ravenUsername, setRavenUsername] = useState('')
  const [errorModal, onModalCancel] = useState(false)
  const [success, onSuccess] = useState(false)
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
  
  const handleCopy = async(e) => { 
    await navigator.clipboard.writeText(e)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 800);
  }

  const handleCopy2 = async(e) => { 
    await navigator.clipboard.writeText(e)
    setCopy2(true)

    setTimeout(() => {
      setCopy2(false)
    }, 800);
  }

  const formatSelectOption = (param) => {
    const list = param?.map((chi) => {
      const { BankName, BankCode, UssdString } = chi;
      return {
        label: BankName,
        value: BankCode,
        ussd_code: String(UssdString),
      };
    });
    return list;
  };


// get transaction ref from url
  const ref = window.location.search
  let trx = ref.split('=')[1]

  const userRef = generateReference()
// end transaction ref getter

// function derived from 3ds authentication
function trigger3ds(){
  var e=document.getElementById("threedsChallengeRedirectForm"); 
  if (e) { e.submit(); if (e.parentNode !== null) { e.parentNode.removeChild(e); } } 
}



// end redux state getter

  // handle api calls
  async function getConfig(){
   await dispatch(getPaymentConfig(trx))
    // if (config) console.log(config)
    // console.log(config, 'ieni')
  }

  async function initCardPayment(){

    const payload = {
      trx_ref: trx,
      currency : "NGN",
      card_number: cardNumber.replaceAll(" ", ""),
      cvv: cvv,
      expiry_month: expiryDate.split('/')[0],
      expiry_year: expiryDate.split('/')[1],
      pay_ref : userRef
  }

  const response = await dispatch(initiateCardTransaction(payload))

  if (response?.payload?.status === 'success') {
    if (response?.payload?.data["3ds_auth"]){

      // load a hidden div that will be part of data response for 21 seconds
      //then send back to server to initiate the transaction

      let divData = response.payload.data.data;
      let div = document.createElement('div');

      //make the div hidden
      div.style.display = 'none';
      div.innerHTML = divData;
      document.body.appendChild(div);
      //wait for 21 seconds
      let externalPrompt;
      // trigger 3ds initialisation
      setIsLoading(true);
      setTimeout(async() => {
        externalPrompt = await dispatch(initiate3dsTransaction({pay_ref: userRef}))
        setViewFrame(externalPrompt);
      }, 8000);
      //end trigger

      if (viewFrame?.payload?.status === "success") {
        setIsLoading(true);
      }
    }
  }

  // console.log(response, 'card_transaction')

  }

  async function retrieveUssdCode(e){

    await dispatch(getUssdCode({ref: trx, code: e}))
  }

  // process transfer request
  async function getBank(){
    await dispatch(getBankAccount(trx));
  }

  // document.querySelector('.external_view_wrapper')?.append(viewFrame?.payload?.data?.data);

  const checkTransferStatus = useCallback((success) => {

      clearInterval(int); 

        int =  setInterval(

          async() => {

        if(success === false)  await dispatch(confirmTransfer(trx))
    
          if(success) return clearInterval(int)
                
        }, 5000);

  }, []) 


  // check card transaction status
  let cardint;
  const checkCardTrxStatus = useCallback((card_ref) => {

    clearInterval(cardint); 

    cardint =  setInterval(

        async(card_ref) => {

      let call = await dispatch(verifyCardTrx(card_ref))
        if(call?.payload?.data?.status === 'successful') onSuccess(true);
        if(call?.payload?.data?.status === 'successful') return clearInterval(cardint)

      }, 5000, [card_ref]);

}, [cardRef]) 

// console.log(raven_pay, 'raven_pay')

  
  // api calls use effect
  useEffect(() => {
    getConfig()
  }, [])

  // effect calls for transfer
  useEffect(() => {
    if (!bank){
      getBank()
    }

    // clear all interval if success is true
    if (success){
      clearInterval(int)
      clearInterval(cardint)
    }


    if (paymentMethod === "transfer" && !success) checkTransferStatus(success);

  }, [paymentMethod === 'transfer'])

  useEffect(() => {
    if (paymentMethod === "ussd" && !success) checkTransferStatus(success);
    if (paymentMethod === "raven" && !success) checkTransferStatus(success);

  }, [paymentMethod === "ussd" || paymentMethod === "raven"])

  useEffect(() => {
    if (paymentMethod === "raven" && !success) dispatch(initRavenPay(trx));

  }, [paymentMethod === "raven"])

  // effect calls checking transfer status
  useEffect(() => {
    if(transferStatus.status === "paid" && transferStatus.is_paid === 1 ){
      onSuccess(true);
      setPaymentMethod(null)
      clearInterval(int)
    }
  }, [transferStatus])
  

  // effect calls to init ussd
  useEffect(() => {
    if (paymentMethod === "ussd"){
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
    }, 500);
   }

  }, [viewFrame])

  useEffect(() => {
    if (card_transaction_status?.payload?.data?.status === 'successful'){
      onSuccess(true)
    }
  }, [card_transaction_status])
  
  //end effects

  // end api calls sections
  

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

  const bankCountDown = () => {
    let min = count?.split(':')[0]
    let sec = count?.split(':')[1]

    return {min, sec}
  }

  
  

  return (

    <div className="raven_webpay_wrapper">

      <div className='modal_wrapper_container'>
        <div onClick={() => onModalCancel(true)} className="close_btn">
          {!success &&
          <figure>
            {icons.close}
          </figure>
          }
        </div>
        {!success && !externalView ? 

                  // show normal payment modal if success & external view are not true
                  <div className="modal_wrapper">
                  {/* Header starts here */}
                  <div className="header_main_container">
                  <div className="header">
                    <div className="header_details">
                      <p className='business_email'>{config?.email}</p>
                      <span onClick={getConfig} className='payment_amount'>
                      <p>Pay</p>
                      <h5>{config?.amount}</h5>
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
          
                    {/* Display card payment if preffered */}
                    {prefferedGateway?.includes('card') &&
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
                    }
          
                    {/* Display card payment  */}
          
                    {/* Show transfer is available as part of payment option */}
                    {prefferedGateway?.includes('bank_transfer') &&
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
                        <span className="bank_name">{bank?.bank}</span>
                        <div className="account_number">
                          <p>{bank?.account_number}</p>
                          <figure onClick={()=> handleCopy(bank?.account_number)} className='copy_icon'>
                            {copied ?
                            <FaCheckCircle /> :
                            icons.copy
                            }
                          </figure>
                        </div>
                        <p className="account_name">
                        {bank?.account_name}
                        </p>
                      </div>
          
                      <div className="expiry_period">
                        <figure>
                          {icons.clock}
                        </figure>
                        <div style={{display:"none"}}>
                        <Countdown
                        countdownTime = {840}
                        count={d => setCount(d)}
                        />
                        </div> 
                        <p>Account Expires in {bankCountDown().min} minutes {bankCountDown().sec} seconds</p>
                      </div>
                    </div>
                    </div>
                    </div>
                    // end show transfer
                    }
          
                    {/* Show raven is available as part of payment option */}
                    {prefferedGateway?.includes('raven') &&
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
                        {!isLoading &&
                         <div className="payment_details_wrapper">
                         <div className="note">Make a single Transfer to this raven account below.</div>
             
                         <div className="main_details">
                           <span className="bank_name">{'Narration'}</span>
                           <div className="account_number">
                             <p>{raven_pay?.raven_pay_ref}</p>
                             <figure onClick={()=> handleCopy(raven_pay?.raven_pay_ref)} className='copy_icon'>
                               {copied ?
                               <FaCheckCircle /> :
                               icons.copy
                               }
                             </figure>
                           </div>
                           <div className="account_name raven_username">

                              <p>ravenpay</p>
                              <figure onClick={() => handleCopy2('ravenpay')}>
                              {copy2 ?
                               <FaCheckCircle /> :
                               icons.copy
                               }
                              </figure>
                            
                           </div>
                         </div>
             
                         <div style={{textAlign: 'center'}} className="expiry_period">
                    
                           <p><b>Note:</b> Make sure you send the exact amount, whilst using the narration provided above.</p>
                         </div>
                       </div>
                    }   
                        </div>
                    </div>
                    </div>
                    // end show raven_payment
                    }
          
                    <div className={`other_options ${moreOptions && 'show'}`}>
                      
                  {/* Show qr is available as part of payment option */}
                  {prefferedGateway?.includes('qr') &&
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
                    // end show qr payment
                    }
          
                  {/* Show qr is available as part of payment option */}
                  {prefferedGateway?.includes('ussd') &&
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
                            
                        <RavenInputField 
                        label="Select preffered bank" 
                        color="light"
                        type="select" placeholder='Select Bank' 
                        name="bank"
                        onChange={e => {
                          setussd(e)
                          retrieveUssdCode(e?.value)
                        }}
                        menuPlacement={'top'}
                        style={{zIndex: "10000", position: "relative"}}
                        selectOption={formatSelectOption(ussd_details?.bank_list)}
                        id="bank" />
                      {ussd && !isUssdLoading &&
                        <div className="payment_details_wrapper">
                      <div className="note">Copy the USSD Code and proceed to pay.</div>
          
                      <div className="main_details">
                        <div className="account_number">
                          <p>{ussd_code?.ussd_string}</p>
                          <figure onClick={()=> handleCopy(ussd_code?.ussd_string)} className='copy_icon'>
                            {copied ?
                            <FaCheckCircle /> :
                            icons.copy
                            }
                          </figure>
                        </div>
                      
                      </div>
                      
                    </div>  
                    }   
          
                    {isUssdLoading && 
                    <div className="spinner_contain">
                  <figure className='spinner'>
                    <img src={spinner} alt="" />
                  </figure>
                    </div>
                    
                    }            
                        </div>
                      </div>
                    </div> 
                    // end show ussd payments section
                    }           
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
                    <RavenButton disabled={ 
                      (stage === "pin" && pinVal.length !== 6) || 
                      (stage === "main" && paymentMethod === "card" && (cvv.length < 2 || cardNumber.length < 8 || expiryDate.length < 3) ) 
                    } 
                    loading={loading || isLoading}
                    label={paymentMethod === "raven" && stage === "main" ? "I have sent the  money"  : paymentMethod !== "transfer" && stage !== "failed-transaction" ? `Pay NGN ${config?.amount}` :  stage === "failed-transaction" ? "Change payment method" : "I have sent the money"}
                    color="green-light"
                    className='pay_btn'
                    onClick={() => {paymentMethod === "raven" && stage === "main" ? setStage('confirming-transaction') : stage === "main" && paymentMethod === "card" ? initCardPayment() : stage === "main" && paymentMethod === "transfer" ? getBank() : ''}}
                    width="100%"
                    />
                  </div>
                  {/* End Payment btn wrap */}
          
                  </div>
          
                  // end show normal payment modaal

          :  externalView ? 

          // show external view if true
          <div  className="external_view_wrapper modal_wrapper">
          {parse(viewFrame?.payload?.data?.data)}
          </div>

          // end show external view if true

          :
        
 // show success modal if trx successful

 <div className="success_wrapper">

 <div className="success_message">
   <figure>
     <img src={limitless} alt="Limitless" />
   </figure>
   <div className="text">
     <h6>Transaction Successful</h6>

     <span>
     <p>You have successfully paid N{config?.amount} to,</p>
     <p><b>{config?.email}</b></p>
     </span>
   
   </div>
 </div>

 <div className="button_wrapper">
   <RavenButton 
   className='btn-outline-white-light success_btn'
   onClick = {() => navigate(callbackUrl)}
   label='Close Payment'
   />
 </div>

   </div>  
   
   // end show success modal if trx successful
         
      }

        {!success && 
        <div className="secured_by">
         {icons.securedBy}
        </div>
          }
      </div>
    
     <RavenModal
     color="black-light"
     visble={errorModal}
     onClose={() => onModalCancel(false)}
     >
      <ErrorModal 
      bigText={"Cancel Payment"}
      smallText={"Are you sure you want to cancel this payment request, please confirm before proceeding."}
      btnText={"Close modal"}
      onClick = {() => navigate(callbackUrl)}
      onCancel={() => onModalCancel(false)}
      />
     </RavenModal>
    </div>
  )
}

export default App
