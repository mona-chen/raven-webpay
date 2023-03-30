import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import store from './redux/store'
import './styles/index.css'
import { RavenToast } from 'raven-bank-ui'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <Provider store={store}>
    <RavenToast />
    <App />
  </Provider>,
  // </React.StrictMode>,
)
