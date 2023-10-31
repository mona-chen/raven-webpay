export class Utilities {
  handleCardNumberChange = ({ event, setCardType, setCardNumber }) => {
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

  /**
   * programmatically inject the app to document body
   */
  inject = () => {
    const ravenpaydiv = document.createElement('div')
    ravenpaydiv.id = 'raven_webpay_wrapper'
    document.body.appendChild(ravenpaydiv)
  }
}
