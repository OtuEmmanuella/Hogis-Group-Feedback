import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        images: path.resolve(__dirname, 'src/assets/Hogis.png'), // Include the path to the images
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Your alias
    },
  },
  server: {
    host: true,
    port: 3000,
  },
});
