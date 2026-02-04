import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  define: {
    'globalThis.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'globalThis.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)
  },
  build: {
    target: 'ES2020',
    minify: 'terser',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: './index.html',
        menu: './menu/index.html',
        music: './music/index.html',
        hiring: './hiring/index.html',
        hiringBanner: './hiring/banner.html',
        blog: './blog/index.html',
        article: './blog/article/index.html'
      },
      output: {
        dir: 'dist',
        // Preserve directory structure
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|tiff|bmp|ico|webp|svg/i.test(ext)) {
            return `images/[name].[hash][extname]`
          } else if (/woff|woff2|ttf|otf|eot/i.test(ext)) {
            return `fonts/[name].[hash][extname]`
          } else if (ext === 'css') {
            return `css/[name].[hash][extname]`
          }
          return `[name].[hash][extname]`
        },
        chunkFileNames: 'js/[name].[hash].js',
        entryFileNames: 'js/[name].[hash].js'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: true
  },
  server: {
    port: 5173,
    open: true,
    cors: true
  }
})
