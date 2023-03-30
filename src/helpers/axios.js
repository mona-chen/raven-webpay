import axios from 'axios'

const API = 'https://integrations.getravenbank.com/v1'

/** base url to make request to the BE end point */

const api = axios.create({
  baseURL: API,
})

// console.log(env.base_url, process.env.NODE_ENV);

export default api
