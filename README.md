# 图片展示网站 · Image Site

React 前端 + Node 后端 + MongoDB。前后台统一设计风格，暗夜模式，相册/标签/搜索/分页，列表用压缩图节省带宽，详情查看原图。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 · Vite · TypeScript · Tailwind CSS · React Router |
| 后端 | Node.js · Express · TypeScript · Mongoose · JWT · multer · sharp |
| 数据库 | MongoDB |
| 图片存储 | 本地磁盘（originals/ 原图 + displays/ 压缩 webp） |

## 快速开始

### 1. 安装依赖

```bash
cd D:\image-site
npm run install:all
```

### 2. 配置环境变量

```bash
cp server/.env.example server/.env
# 按需修改 MONGODB_URI / JWT_SECRET / ADMIN_PASSWORD
```

### 3. 启动 MongoDB

本地装 MongoDB 或用 Docker：

```bash
docker run -d --name mongo -p 27017:27017 mongo:7
```

### 4. 启动开发服务

```bash
npm run dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:4000
- 默认管理员：admin / admin123（首次启动自动创建）

## 功能

### 公开画廊

- 响应式瀑布流展示，列表加载压缩 webp（约 1/5 体积）
- 点击查看原图 + 下载
- 按相册浏览、按标签筛选、关键词搜索
- 分页加载更多
- 暗夜模式（明亮/暗夜/跟随系统三态）

### 后台管理

- `/admin/login` 管理员登录（JWT）
- `/admin/upload` 拖拽 + 批量上传，可指定相册与标签
- `/admin/manage` 图片管理，行内编辑标题/标签/相册，删除
- `/admin/albums` 相册增删改

## 目录结构

```
image-site/
├── server/                 后端
│   ├── src/
│   │   ├── config.ts       配置
│   │   ├── db.ts           MongoDB 连接
│   │   ├── index.ts        入口
│   │   ├── models/         User / Image / Album
│   │   ├── middleware/     auth / upload / error
│   │   ├── routes/         auth / images / albums / tags
│   │   └── utils/          storage (sharp 压缩)
│   └── uploads/
│       ├── originals/      原图
│       └── displays/       压缩展示图
└── client/                 前端
    └── src/
        ├── components/     Navbar / ImageGrid / Lightbox / ...
        ├── pages/          Gallery / AlbumView / Search / ImageDetail
        │   └── admin/      Login / Upload / Manage / Albums
        ├── hooks/          useTheme / useInfiniteScroll
        ├── lib/            api / utils
        └── store/          auth
```

## API

| Method | Path | 说明 | 鉴权 |
|---|---|---|---|
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 验证 token | 否 |
| GET | /api/images | 列表（page/limit/search/albumId/tag） | 否 |
| GET | /api/images/:id | 详情 | 否 |
| GET | /api/images/:id/download | 下载原图 | 否 |
| POST | /api/images | 上传（multipart，最多 50 张） | 是 |
| PATCH | /api/images/:id | 编辑 | 是 |
| DELETE | /api/images/:id | 删除 | 是 |
| GET | /api/albums | 相册列表 | 否 |
| GET | /api/albums/:id | 单个相册 | 否 |
| POST | /api/albums | 创建 | 是 |
| PATCH | /api/albums/:id | 编辑 | 是 |
| DELETE | /api/albums/:id | 删除 | 是 |
| GET | /api/tags | 标签列表 | 否 |
