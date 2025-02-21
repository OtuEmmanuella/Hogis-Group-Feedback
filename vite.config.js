import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: [
      'canvas-confetti',
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/firestore',
      'firebase/storage',
      'firebase/auth',
      'framer-motion',
      'lucide-react'
    ],
    force: true
  },
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
          'vendor-ui': ['framer-motion', 'lucide-react', 'canvas-confetti'],
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
    }
  },
  server: {
    host: 'localhost',
    port: 3001,
    hmr: {
      overlay: false
    },
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8888/.netlify/functions',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});