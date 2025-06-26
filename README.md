# 34.-StayInn

# Default Markdown Text Generated when creating a Vite project

## React + Vite
This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

<br>

# What is React?
React is a JavaScript library created by Facebook. It is a User Interface (UI) library and provides tools for building UI components. (Front-end)

<br>

# What is Vite? How does it relate to React?
Vite is a build tool that allows you to start up your project instantly and see changes you make immediately.
With Vite, there’s no more re-running your code all the time, wasting valuable seconds, which turn into minutes and hours. Instead, you immediately see the changes you make, no matter the size of your code base. The result: You become a faster, more efficient, and happier developer!

Vite is perfect for:
- Rapid frontend development with frameworks including React, Vue, and Svelte
- Applications that require optimized production builds with minimal configuration
- Developers who want a lightweight, efficient alternative to traditional bundlers such as Webpack

## How to create and run a Vite project?
1. Run Vite project scaffolding tool
```bash
npm create vite@latest
```

2. You’ll be prompted:
```bash
Project name: .
```
→ This creates the files at the current folder you are at

3. You'll also be prompted:
```bash
Package name: my-react-app
```
→ This creates a new folder called 'my-react-app'

4. Navigate into the new project folder
```bash
cd my-react-app
```

5. Install dependencies
```bash
npm install
```

6. You can start the development server with
```bash
npm run dev
```

## How build and deploy a Vite project?
1. Build the Project for Production
```bash
npm run build
```
What this does:
- Bundles your app using Rollup
- Outputs static assets into the 'dist/' folder
- Optimizes for performance: minified JS, hashed filenames, etc.

Expected Output in Terminal:
```bash
vite v5.x.x building for production...
✓ 3 modules transformed.
dist/index.html        0.45 kB
dist/assets/index-xxxx.js   2.53 kB │ gzip: 1.23 kB
...
```

2. Preview the Production Build Locally
```bash
npm run preview
```
This starts a local static server using the production files in 'dist/' folder.

Expected Output in Terminal:
```bash
Local:  http://localhost:4173/
```

3. Deploy the 'dist/' folder

You can now deploy the contents of the 'dist/' folder to any static hosting provider like:
| Hosting Option       | Deployment Command/Steps                        |
| -------------------- | ----------------------------------------------- |
| **Netlify**          | Drag `dist/` folder or use `netlify deploy` CLI |
| **Vercel**           | `vercel` will auto-detect and use `dist/`       |
| **GitHub Pages**     | Push `dist/` to a `gh-pages` branch             |
| **Firebase Hosting** | Use `firebase deploy` after `firebase init`     |
| **Surge**            | `surge dist/ your-domain.surge.sh`              |


## How to extend your Vite project with Plugins
What is a Plugin?
Plugins are tools that extend or customize Vite’s behavior during the build or dev process. They allow you to:
- Add support for custom file types (e.g., Markdown, Pug)
- Transform or preprocess files (e.g., Babel, PostCSS)
- Add features like auto-importing, aliasing, etc.
- Hook into Vite’s internal lifecycle (e.g., before/after dev server starts, before build output, etc.)

How to use a Vite plugin?
1. Install the plugin as a dev dependency in 'package.json'
   - You can do so by the command:
```bash
npm install -D [plugin-name]
```

2. Import and add it to the plugins array in 'vite.config.js'
```bash
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { qrcode } from 'vite-plugin-qrcode'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), qrcode(), svgr()],
  ...
})
```

3. Check the plugin documentation for additional configurations

<br>

Source:
- https://www.youtube.com/watch?v=do62-z3z6FM&t=168s (freeCodeCamp) (YouTube video by freeCodeCamp titled, 
  Vite Crash Course – Frontend Build Tool)
