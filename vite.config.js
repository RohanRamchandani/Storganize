import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: [],
    },
    server: {
        fs: {
            allow: ['.'],
        },
    },
    build: {
        rollupOptions: {
            input: 'index.html',
        },
    },
})
