import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import store from './redux/store'
import './styles/index.css'
import { RavenToast } from 'raven-bank-ui'

const iframe = document.createElement("div");
iframe.id = "raven_webpay_wrapper";
document.body.appendChild(iframe);

// const linkElement = document.createElement("link");
// linkElement.setAttribute("rel", "stylesheet");
// linkElement.setAttribute("type", "text/css");
// linkElement.setAttribute(
//   "href",
//   "https://drive.google.com/uc?export=view&id=1Ee-VrZpGjbfFIOpV_PZQfPqIcZ9DLBcz"
// );
// document.head.appendChild(linkElement);

ReactDOM.createRoot(document.getElementById('raven_webpay_wrapper')).render(
  
  // <React.StrictMode>
  <Provider store={store}>
    <RavenToast />
    <App />
  </Provider>,
  // </React.StrictMode>,
)
