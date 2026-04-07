import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://178.104.118.20:8000'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc1NTk0OTAwLCJleHAiOjIwOTA5NTQ5MDB9.BxbfoChXPBlxlquF_enzBI8GAVnbmRAIDxCJJedD-UU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
