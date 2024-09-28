import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 8080, // Your desired port
  },
  assetsInclude: ['**/*.JPG'], // Move this line outside the server object
});
