import axios from 'axios'
import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

/**
 * Axios instance pre-configured to talk to the Django backend.
 * Automatically attaches the Supabase access token as a Bearer header.
 */
const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: attach Supabase session token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})

export default api
