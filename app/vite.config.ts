import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  resolve: {
    alias: {
      '@components': path.resolve(process.cwd(), 'src/components'),
      '@assets': path.resolve(process.cwd(), 'src/assets'),
      '@styles': path.resolve(process.cwd(), 'src/styles'),
      '@utils': path.resolve(process.cwd(), 'src/utils'),
      '@types': path.resolve(process.cwd(), 'src/types'),
      '@hooks': path.resolve(process.cwd(), 'src/hooks'),
      '@services': path.resolve(process.cwd(), 'src/services'),
    }
  },
  server: {
    port: 5174,
    hmr: false, // Desabilitar HMR completamente
    watch: null, // Desabilitar watch de arquivos
    middlewareMode: false,
    host: true,
    fs: {
      strict: false
    }
  },
  // Otimizações habilitadas para produção
  optimizeDeps: {
    include: ['react', 'react-dom', '@elevenlabs/react', 'lucide-react']
  },
  // Configurações de build otimizadas
  build: {
    watch: null,
    rollupOptions: {
      watch: false,
      output: {
         manualChunks: (id) => {
           // Separar node_modules em chunks específicos
           if (id.includes('node_modules')) {
             if (id.includes('react') || id.includes('react-dom')) {
               return 'react-vendor';
             }
             if (id.includes('@elevenlabs')) {
               return 'elevenlabs-vendor';
             }
             if (id.includes('lucide-react')) {
               return 'icons-vendor';
             }
             // Outros node_modules em chunk separado
             return 'vendor';
           }
         }
       }
    },
    // Otimizações adicionais
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Reduzir limite de warning para chunks
    chunkSizeWarningLimit: 300
  },
  // Configurações adicionais para evitar hot updates
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  define: {
    'process.env.NODE_ENV': '"development"'
  }
})
