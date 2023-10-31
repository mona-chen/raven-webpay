import axios from 'axios'

const API = 'https://integrations.getravenbank.com/v1'
// const API = 'https://adee-156-0-250-54.ngrok-free.app'

/** base url to make request to the BE end point */

const api = axios.create({
  baseURL: API,
  headers: {
    'ngrok-skip-browser-warning': '69420',
  },
})

// console.log(env.base_url, process.env.NODE_ENV);

export default api
