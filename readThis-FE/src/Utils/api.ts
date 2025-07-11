import axios from "axios";

const backend_url = import.meta.env.VITE_BACKEND_URL;
const api = axios.create({
  baseURL: backend_url,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // Adjust based on your storage mechanism
  console.log(token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
