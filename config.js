// ĐƯỜNG DẪN CHUẨN ĐÃ QUA KIỂM TRA: Lấy bản v2 mới nhất định dạng ES Module từ jsDelivr
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Thông tin kết nối dự án Independence City của ông trên Supabase
const supabaseUrl = 'https://psxinmpnvyqrdpiukasl.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzeGlubXBudnlxcmRwaXVrYXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NjUxMTQsImV4cCI6MjEwNzI0MTExNH0.YcWHh_tlUZSEvuqp8D0dm9Ag4GrhCIMaXorg2SDH6AU'; 

// Khởi tạo và xuất thực thể kết nối duy nhất ra cho toàn bộ dự án
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
