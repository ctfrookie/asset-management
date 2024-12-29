# 资产管理系统

一个基于 Express 和 React 的资产管理系统，用于管理企业 IT 资产。

## 功能特性

- 🔐 用户认证与权限管理
- 📦 资产管理（增删改查）
- 🏷️ 分类管理
- 👥 用户管理
- 📊 数据导入导出
- 💻 响应式界面设计
- 🖱️ 使用 Cursor 开发

## 技术栈

### 后端
- Node.js + Express
- MySQL
- JWT 认证
- RESTful API

### 前端
- React 18
- Ant Design 5
- React Router 6
- Axios

## 快速开始

### 环境要求
- Node.js >= 14
- MySQL >= 5.7
- npm >= 6

### 安装步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/yourusername/asset-management.git
   cd asset-management
   ```
2. 安装依赖
   ```bash
   npm run install-all
   ```
3. 配置环境变量
   复制 `.env.example` 到 `.env` 并修改配置：
   ```env
   DB_HOST=localhost
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=asset_management
   JWT_SECRET=your_jwt_secret
   PORT=3001
   ```
4. 启动开发服务器
   ```bash
   npm run dev
   ```

现在你可以访问：
- 前端: [http://localhost:3000](http://localhost:3000)
- 后端: [http://localhost:3001](http://localhost:3001)

### 默认管理员账号
- 用户名：admin
- 密码：admin123

## 项目结构
```
asset-management/
├── app.js # 后端入口文件
├── config/ # 配置文件
├── controllers/ # 控制器
├── middleware/ # 中间件
├── routes/ # 路由
├── uploads/ # 上传文件目录
└── asset-management-client/ # 前端项目
├── src/
│ ├── components/ # 组件
│ ├── hooks/ # 自定义钩子
│ ├── pages/ # 页面
│ └── utils/ # 工具函数
└── public/ # 静态资源
```

## API 文档

### 认证相关
- POST /api/users/login - 用户登录
- POST /api/users/change-password - 修改密码

### 资产管理
- GET /api/assets - 获取资产列表
- POST /api/assets - 创建资产
- PUT /api/assets/:id - 更新资产
- DELETE /api/assets/:id - 删除资产
- GET /api/assets/export - 导出资产
- POST /api/assets/import - 导入资产

### 分类管理
- GET /api/categories - 获取分类列表
- POST /api/categories - 创建分类
- PUT /api/categories/:id - 更新分类
- DELETE /api/categories/:id - 删除分类

### 用户管理 (需要管理员权限)
- GET /api/users - 获取用户列表
- POST /api/users - 创建用户
- PUT /api/users/:id - 更新用户
- DELETE /api/users/:id - 删除用户

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 开源协议

本项目采用 MIT 协议，详见 [LICENSE](LICENSE) 文件。
