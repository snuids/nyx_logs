import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// La version affichee en bas de l'ecran est celle du paquet : elle disait `v0.9` depuis la 1.0.
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/logs/', // Change this to your desired base path
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
})

