const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let pool = null;

// 初始化数据库和表
const initDatabase = async () => {
  let initialPool = null;
  try {
    // 使用服务名 mysql 作为主机名
    initialPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await initialPool.promise();

    // 创建数据库（如果不存在）
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`
    );
    await connection.query(`USE ${process.env.DB_NAME}`);

    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        real_name VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        department VARCHAR(50),
        status ENUM('active', 'disabled') DEFAULT 'active',
        last_login DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 检查是否需要更新用户表结构
    try {
      // 检查 status 列是否存在
      await connection.execute("SELECT status FROM users LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        // 如果列不存在，添加新列
        await connection.execute(
          "ALTER TABLE users ADD COLUMN status ENUM('active', 'disabled') DEFAULT 'active'"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN real_name VARCHAR(50)"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN email VARCHAR(100)"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN phone VARCHAR(20)"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN department VARCHAR(50)"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN last_login DATETIME"
        );
        await connection.execute(
          "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        );
        console.log("用户表结构已更新");
      }
    }

    // 创建分类表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建资产表（如果不存在）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        category_id INT,
        status ENUM('in_use', 'available', 'maintenance', 'disposed') DEFAULT 'available',
        ip_address VARCHAR(15),
        port VARCHAR(255),
        add_date DATE,
        purchase_price DECIMAL(10, 2),
        current_value DECIMAL(10, 2),
        location VARCHAR(100),
        assigned_to INT,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `);

    // 检查是否需要更新资产表结构
    try {
      // 检查 ip_address 列是否存在
      await connection.execute("SELECT ip_address FROM assets LIMIT 1");
    } catch (error) {
      if (error.code === "ER_BAD_FIELD_ERROR") {
        // 如果列不存在，添加新列
        await connection.execute(
          "ALTER TABLE assets ADD COLUMN ip_address VARCHAR(15)"
        );
        await connection.execute(
          "ALTER TABLE assets ADD COLUMN port VARCHAR(255)"
        );
        await connection.execute("ALTER TABLE assets ADD COLUMN remarks TEXT");
        await connection.execute(
          "ALTER TABLE assets CHANGE purchase_date add_date DATE"
        );
        console.log("资产表结构已更新");
      }
    }

    console.log("数据库和表创建成功");

    // 初始化管理员用户
    const [users] = await connection.execute(
      "SELECT * FROM users WHERE username = ?",
      ["admin"]
    );

    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await connection.execute(
        "INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)",
        ["admin", hashedPassword, "admin", "active"]
      );
      console.log("默认管理员用户创建成功");
      console.log("用户名: admin");
      console.log("密码: admin123");
    } else {
      // 确保管理员用户状态为激活
      await connection.execute(
        "UPDATE users SET status = 'active' WHERE username = ?",
        ["admin"]
      );
      console.log("管理员用户已存在");
    }

    // 初始化默认分类
    const defaultCategories = [
      { name: "交换机", description: "网络交换设备" },
      { name: "路由器", description: "网络路由设备" },
      { name: "服务器", description: "各类服务器设备" },
      { name: "工作站", description: "高性能工作站" },
      { name: "打印机", description: "打印输出设备" },
      { name: "显示器", description: "显示设备" },
      { name: "安全设备", description: "防火墙等网络安全设备" },
      { name: "存储设备", description: "NAS、SAN等存储设备" },
    ];

    console.log("开始初始化默认分类...");
    for (const category of defaultCategories) {
      const [existing] = await connection.execute(
        "SELECT * FROM categories WHERE name = ?",
        [category.name]
      );

      if (existing.length === 0) {
        await connection.execute(
          "INSERT INTO categories (name, description) VALUES (?, ?)",
          [category.name, category.description]
        );
        console.log(`添加默认分类: ${category.name}`);
      }
    }

    // 创建正式的数据库连接池
    pool = mysql
      .createPool({
        host: process.env.DB_HOST || "localhost",
        port: 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "asset_management",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
      .promise();
  } catch (error) {
    console.error("初始化数据库失败:", error);
    process.exit(1);
  } finally {
    // 在 finally 块中关闭初始连接池
    if (initialPool) {
      await initialPool.end();
    }
  }
};

// 获取数据库连接池
const getPool = () => {
  if (!pool) {
    throw new Error("数据库连接池未初始化");
  }
  return pool;
};

// 执行初始化
initDatabase();

module.exports = {
  getPool,
  initDatabase,
};
