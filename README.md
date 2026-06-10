# PCAP Viewer Online

一个基于 WebAssembly (Emscripten) 和开源 Wireshark 引擎的纯前端、免费在线 PCAP/PCAPNG 网络数据包分析工具。
用户的所有抓包文件均在本地浏览器中进行解析与分析，**绝对不会上传到任何外部服务器**，确保数据的绝对隐私与安全。

## 🚀 快速开始

本项目基于 [Next.js](https://nextjs.org/) 开发。

### 启动开发服务器

```bash
npm install
npm run dev
# 或者使用 yarn / pnpm / bun
```

使用浏览器打开 [http://localhost:3000](http://localhost:3000) 即可查看页面。

### 🐳 Docker 部署 (推荐生产环境)

本项目已经优化了 `standalone` 模式并内置了多阶段构建的 `Dockerfile`，体积极小。

1. **构建镜像**：
   ```bash
   docker build -t pcap-viewer-online .
   ```
2. **运行容器**：
   ```bash
   docker run -p 3000:3000 -d pcap-viewer-online
   ```
打开浏览器访问 `http://localhost:3000` 即可使用。

---

## 🎨 UI/UX 设计规范 (Technical Brutalism)

> ⚠️ **极其重要**：为了保持网站独特、高级且极客的视觉风格，本项目强制采用了 **Technical Brutalism（工业机械野兽派 / 技术野兽派）** 设计语言。
> **在后续添加任何新功能或修改 UI 时，绝不可使用“毛玻璃(Glassmorphism)”、“软阴影”、“大圆角”、“柔和渐变”等常规的平庸设计！必须严格遵守以下规范。**

### 1. 核心设计哲学
- **生硬无情 (Unapologetic)**：抛弃一切修饰性的圆角，组件的 `border-radius` 必须为 `0`，呈现刀砍斧凿般的机械切割感。
- **功能即装饰 (Data as Decor)**：将底层技术参数、代码或工业伪装标语作为装饰元素暴露在外（例如添加 `::before` 伪元素并设置 `INFO_NODE //` 或 `DATA_STREAM` 字样）。

### 2. 严苛的色彩系统
绝对禁止使用常规的浅蓝、浅灰等“小清新”颜色。必须使用极高对比度、带有强烈警告意味的工业色彩：
- **全局主体背景**：工业水泥灰 `#e5e5e5`
- **主要边框与文字**：绝对纯黑 `#000000`
- **警戒黄 (Caution Yellow)**：`#ffcf00` (用于悬浮卡片背景、警告提示、悬停状态等)
- **黑客霓虹绿 (Neon Green)**：`#00ff41` (用于主按钮、硬核代码文字等)
- **安全橙 (Safety Orange)**：`#ff4d00` (用于强调色、关闭按钮、悬停阴影、标题文字阴影等)

### 3. 排版与字体规范 (Typography)
- **巨型大标题/展示元素**：必须使用 `Bebas Neue` (CSS 变量: `var(--font-bebas)`)，这是一款极具压迫感和视觉冲击力的全大写海报字体。
- **常规正文、按钮与数据展示**：必须使用等宽字体 `JetBrains Mono` (CSS 变量: `var(--font-jetbrains)`)，营造复古终端控制台的极客氛围。

### 4. 几何线条与硬核交互
- **实体粗边框**：所有输入框、大按钮、卡片区域必须携带 `2px` 至 `4px` 厚度的 `solid #000000` 纯黑边框。
- **无模糊实体阴影 (Solid Drop Shadows)**：禁止使用 CSS 的 `box-shadow` 的 `blur` 模糊参数。必须使用绝对位移阴影，例如 `box-shadow: 8px 8px 0px #000000;`。
- **机械按压式动画**：在鼠标悬停 (Hover) 任何可交互元素时，不能只变色，必须使用 `transform: translate(Xpx, Ypx);` 同步减小同等像素的阴影距离，以完美模拟真实的“沉重物理机械按键”被按压的触觉反馈。
- **十字准星指针**：为了强调数据分析的精准度和硬核属性，页面的鼠标指针需设置为 `cursor: crosshair;`。

---

*后续的代码维护者：编写新组件前，请先仔细阅读并复用 `src/app/page.module.css` 中的 Brutalism 样式！*
