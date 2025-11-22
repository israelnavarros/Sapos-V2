import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  define: {
    __VITE_BACKEND_URL__: JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:5000')
  }
});