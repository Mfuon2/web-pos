import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const version = readFileSync(join(__dirname, '.version'), 'utf-8').trim()

export default defineConfig({
    plugins: [vue()],
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(version)
    },
    server: {
        hmr: {
            overlay: false
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8789',
                changeOrigin: true
            }
        }
    }
})
