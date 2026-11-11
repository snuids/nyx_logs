import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The version shown at the bottom of the screen is the package's: it had been saying `v0.9` since 1.0.
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/logs/', // Change this to your desired base path
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
})

