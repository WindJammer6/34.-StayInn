import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  // Lesson 5 (Extend with Plugins): Adding the QR code Vite Plugin which allows you to preview your local 
  // Vite project development on a mobile device via a scannable QR code in your terminal

  // Lesson 5 (Extend with Plugins) (Challenge): Adding the SVGR Vite Plugin which allows you to import SVG 
  // files as React components in a Vite + React project
  plugins: [react(), qrcode(), svgr()],


  // Lesson 4 (Configure with options): Configuration on the Vite project, changing the port used from 
  // the default 'port 5173' to 'port 3000'
  server: {
    port: 3000
  }

})