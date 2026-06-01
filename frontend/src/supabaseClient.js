import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hnqfsfjobjirbddsnfau.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhucWZzZmpvYmppcmJkZHNuZmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODEwNjQsImV4cCI6MjA5MDQ1NzA2NH0.ihTY7w6nuXdUgO0CN34EFr69nv65ahxpRsm8UWxt1zY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
