import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:3001";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});