import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': [
            'firebase/app',
            'firebase/firestore',
            'firebase/storage',
            'firebase/auth'
          ],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'components': [
            './src/components/Modal.jsx',
            './src/components/ReactionButton.jsx',
            './src/components/Feedback-Dashboard/FeedbackDashboard.jsx'
          ],
          'pages': [
            './src/pages/Feedback/FeedbackPage.jsx',
            './src/pages/SplashPage.jsx'
          ]
        }
      }
    },
    copyPublicDir: true,
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:9999',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/.netlify/functions')
      }
    }
  },
});