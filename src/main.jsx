import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import store from './redux/store'
import './styles/index.css'
import { RavenToast } from 'raven-bank-ui'
import IFrame from './Iframed';

const root = parent.document.getElementById('root')

var divs = document.querySelectorAll('div');
[].forEach.call(divs, function(div) {

  let main = div.querySelector('div')
  // let load = main.querySelectorAll('iframe')[0].contentWindow.document.readyState === 'complete'

console.log(main)
  //   main.querySelectorAll('iframe').forEach( item =>{

  //     item.contentWindow.document.body.querySelector('[aria-label="Close"]').style.display = 'none' 

  //   }
  // ) 

});

window.start = false;

ReactDOM.createRoot(parent.document.getElementById('root')).render(
  // <React.StrictMode>
  // <IFrame

 <Provider store={store}>
    <RavenToast />
    <App />
  </Provider>,
  // </IFrame>
 
  // </React.StrictMode>,
)
