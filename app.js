const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 更宽松的 CORS 配置
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());
// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true }));

// 路由配置
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/assets", require("./routes/assetRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
