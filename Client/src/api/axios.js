import axios from 'axios';

const baseURL = import.meta.env.VITE_SERVER_SIDE_API_URL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

export default axiosInstance;