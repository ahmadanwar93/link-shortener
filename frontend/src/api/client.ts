import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// creating a reusable Axios instance with the config we passed in
export const apiClient = axios.create({
  baseURL: API_URL,
  // tells the browser to send cookes with cross origin request
  withCredentials: true,
});
