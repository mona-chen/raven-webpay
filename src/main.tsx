import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import store from './redux/store'
import './styles/index.css'
import { RavenToast } from 'raven-bank-ui'

const iframe = document.createElement('div')
iframe.id = 'raven_webpay_wrapper'
document.body.appendChild(iframe)

const renderRoot: any = document.getElementById('raven_webpay_wrapper')

if (renderRoot) {
  ReactDOM.createRoot(renderRoot).render(
    <React.StrictMode>
      <Provider store={store}>
        <RavenToast />
        <App />
      </Provider>
      ,
    </React.StrictMode>,
  )
}
