import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': 'http://localhost:5000',
      '/save_chat': 'http://localhost:5000',
      '/clear_chat': 'http://localhost:5000',
      '/load_chat': 'http://localhost:5000',
      '/list_chats': 'http://localhost:5000',
      '/delete_chat': 'http://localhost:5000'
    }
  }
})
