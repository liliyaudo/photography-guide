# 立里 · 摄影实战指南

手机优先的个人现场摄影手册。基于同目录的两份 Markdown 原稿，当前以 Canon EOS 90D + 18–135mm、单人人像为核心。

## 本机运行

需要 Node.js 18 或更新版本。当前电脑已具备 Node.js，无需下载依赖。

在这个文件夹打开 PowerShell，运行：

```powershell
node server.mjs
```

在浏览器打开 **http://localhost:4173**。保持终端开启，按 Ctrl+C 停止。

若端口已占用，可以换端口：

```powershell
$env:PORT = '4174'
node server.mjs
```

然后打开 http://localhost:4174 。不要直接双击 index.html，数据需要通过 HTTP 读取。

服务器默认只接受本机连接。本版可以在手机宽度或浏览器设备模拟中使用，暂未发布互联网地址或开放手机局域网访问。

## 项目结构

```text
index.html           页面入口
server.mjs           Node 静态服务器（无第三方依赖）
package.json         项目说明与运行脚本
vercel.json          Vercel 静态部署配置
scripts/build.mjs    构建 dist，校验语法、数据与资源复制
src/app.js           页面路由、搜索、交互与本机记录
src/styles.css       手机 / 桌面布局与浅色 / 深色主题
data/guide.json      独立知识数据
scripts/check.mjs    数据与 HTTP 资源检查
摄影指南_知识库.md    原始知识库，保留不变
Codex_建站指令.md     原始建站需求，保留不变
```

本版使用原生 JavaScript 模块与 CSS，避免安装依赖；无后端数据库。页面支持直接通过 #scenes、#wb、#detail/window 等链接打开。

## 内容与功能

- 首页：场景快捷入口、完整工具入口、拍摄优先级。
- 场景：10 张卡片，支持自然光、闪光、室内、构图筛选。
- 救命：9 个问题，提供先检查、两步修正、不要做什么。
- 找光与焦段、M / Av、曝光三要素、闪光流程图。
- 白平衡：K 值方向滑杆、B/A/G/M 坐标、组合偏色修正、B5 G1 解读。
- Picture Style：Portrait 与 Standard 起点。
- 全文搜索：忽略大小写、空格、斜线等，支持 B5G1、M1、1/160、f/5.6。
- 本机收藏、备注、验证标记、添加实拍记录、备份导出 / 合并导入。
- 后期、练习、全家福作为次级内容。

K 值滑杆仅演示方向，不模拟真实皮肤或相机成像。参数均为试拍起点；更长焦段可能无法使用 f/4。普通闪光同步和环境 / 闪光曝光分离有适用条件，知识卡内有说明。

## 新增摄影经验

打开“我的经验”，填写实拍标题和参数心得即可。每张知识卡底部还可以收藏、写备注、标记验证有效。

记录保存在当前浏览器的 localStorage（键 lili-guide-v1）。更换浏览器、端口或清理站点数据会使用另一份或丢失记录。请用“导出备份”下载 JSON，随后可“导入备份”合并恢复。

## 修改知识库

编辑 `data/guide.json`，刷新浏览器生效。仅修改原始 Markdown 不会自动同步到网页。

- `scenes`：场景参数卡，使用唯一 id，包含 title、category、scene、lightType、mode、focalLength、aperture、shutter、iso、kelvin、wbShift、flash、focus、tips、warnings。
- `rescue`：问题卡，包含 id、title、category、check、steps、avoid。
- `articles`：文章卡，包含 id、title、category、summary、sections；sections 的每项包含 title 和 items；可选 values 显示参数表。
- 相机与镜头为全站共用配置，放在 `meta` 中。
- 个人备注独立保存在 localStorage，不会改写知识数据。

新增卡片时不要复用旧 id，避免混淆已有收藏和备注。

## 检查

保持服务器运行，在另一终端执行：

```powershell
node --check src/app.js
node --check server.mjs
node scripts/check.mjs
```

## 构建与 Vercel 部署

框架：**无框架的静态网站（原生 HTML / CSS / JavaScript ES Modules）**。Node.js 仅用于本地服务器和构建；线上不需要运行 `server.mjs`。

执行构建，无需安装第三方依赖：

```powershell
node scripts/build.mjs
```

如果本机安装了 npm，也可以使用同一个构建入口：

```powershell
npm run build
```

构建会原样复制 `index.html`、`src/app.js`、`src/styles.css`、`data/guide.json` 到 `dist/`，并检查 JS 语法、JSON 数据以及复制结果。不改变网页内容，不发布原始 Markdown、README、本机服务器或截图。`dist/` 是生成物，不需要上传 GitHub。

把源码上传 GitHub 后，在 Vercel 导入仓库，Root Directory 选择包含 `package.json` 的项目根目录。仓库内 `vercel.json` 已配置：

| 配置项 | 值 |
| --- | --- |
| Framework Preset | Other（`framework: null`） |
| Build Command | `node scripts/build.mjs` |
| Output Directory | `dist` |
| Install Command | 空字符串，跳过安装依赖 |

不要选择 Next.js / React 框架预设，也不要把 `node server.mjs` 设为构建命令。当前页面使用 `#scenes`、`#wb` 等 hash 路由，服务器接收到的路径仍为 `/`，无需 SPA 通配重写。

`.gitignore` 已排除依赖、构建输出、Vercel 本机配置、环境密钥文件、预览截图及常见临时文件；`package.json`、`vercel.json`、源码、数据、构建脚本和使用说明仍应上传。原始两份 Markdown 也保留为可提交的项目文档。

部署后的收藏、备注和经验仍然保存在浏览器中，不会同步到服务器。本机与 Vercel 地址属于不同站点；需要迁移记录时，先在本机导出备份，再到线上导入。

参考：[Vercel 配置文档](https://vercel.com/docs/project-configuration/vercel-json)。本项目目前仅完成部署准备，未上传 GitHub 或执行线上部署。
