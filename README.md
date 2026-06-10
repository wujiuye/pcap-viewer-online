# PCAP Viewer Online

A pure front-end, free online PCAP/PCAPNG network packet analysis tool based on WebAssembly (Emscripten) and the open-source Wireshark engine.
All user capture files are parsed and analyzed locally in the browser, **absolutely no data is uploaded to any external servers**, ensuring complete privacy and data security.

## 🚀 Quick Start

This project is built with [Next.js](https://nextjs.org/).

### Start Development Server

```bash
npm install
npm run dev
# or use yarn / pnpm / bun
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 🐳 Docker Deployment (Recommended for Production)

This project is optimized for `standalone` mode and includes a multi-stage `Dockerfile` with a minimal footprint.

1. **Build the image**:
   ```bash
   docker build -t pcap-viewer-online .
   ```
2. **Run the container**:
   ```bash
   docker run -p 3000:3000 -d pcap-viewer-online
   ```
Open your browser and visit `http://localhost:3000` to use it.

---

## 🎨 UI/UX Design Guidelines (Technical Brutalism)

> ⚠️ **CRITICAL**: To maintain the unique, premium, and geeky visual style of the website, this project strictly adopts the **Technical Brutalism** design language.
> **When adding new features or modifying the UI in the future, NEVER use generic design trends like "Glassmorphism", "soft shadows", "large rounded corners", or "soft gradients"! The following guidelines must be strictly followed.**

### 1. Core Design Philosophy
- **Unapologetic**: Discard all decorative rounded corners. Component `border-radius` must be `0` to present a raw, mechanically cut feel.
- **Data as Decor**: Expose low-level technical parameters, code snippets, or industrial pseudo-slogans as decorative elements (e.g., adding a `::before` pseudo-element with texts like `INFO_NODE //` or `DATA_STREAM`).

### 2. Strict Color System
The use of generic "fresh" colors like light blue or light gray is strictly prohibited. You must use ultra-high contrast industrial colors with a strong sense of warning:
- **Global Primary Background**: Industrial Cement Gray `#e5e5e5`
- **Primary Borders and Text**: Absolute Solid Black `#000000`
- **Caution Yellow**: `#ffcf00` (used for hover card backgrounds, warnings, hover states, etc.)
- **Neon Green**: `#00ff41` (used for primary buttons, hardcore code text, etc.)
- **Safety Orange**: `#ff4d00` (used for accents, close buttons, hover shadows, text shadows for titles, etc.)

### 3. Typography
- **Giant Headers / Display Elements**: Must use `Bebas Neue` (CSS variable: `var(--font-bebas)`), an all-caps poster font with an overwhelming and striking visual impact.
- **Standard Body, Buttons, and Data Display**: Must use the monospace font `JetBrains Mono` (CSS variable: `var(--font-jetbrains)`) to create a geeky vibe reminiscent of retro terminal consoles.

### 4. Geometry and Hardcore Interactions
- **Solid Thick Borders**: All input fields, large buttons, and card areas must carry a solid black border (`solid #000000`) with a thickness of `2px` to `4px`.
- **Solid Drop Shadows**: CSS `box-shadow` with `blur` parameters is strictly forbidden. You must use absolute offset shadows, for example: `box-shadow: 8px 8px 0px #000000;`.
- **Mechanical Press Animation**: When hovering over any interactive element, simply changing colors is not enough. You must use `transform: translate(Xpx, Ypx);` to synchronously reduce the shadow distance by the exact same pixels, perfectly simulating the tactile feedback of a heavy, physical mechanical key being pressed.
- **Crosshair Cursor**: To emphasize the precision and hardcore nature of data analysis, the mouse pointer on the page must be set to `cursor: crosshair;`.

---

*For future code maintainers: Before writing new components, please carefully read and reuse the Brutalism styles in `src/app/page.module.css`!*

---

## 🤝 Acknowledgments

This project uses the Wireshark wasm binary compiled by the [Wiregasm](https://github.com/good-tools/wiregasm) project.
