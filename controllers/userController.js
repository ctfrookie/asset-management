const { getPool } = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 获取用户列表
exports.getUsers = async (req, res) => {
  try {
    const [users] = await getPool().execute(
      "SELECT id, username, role, real_name, email, phone, department, status, last_login, created_at FROM users"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 创建用户
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      role = "user",
      real_name = "",
      email = "",
      phone = "",
      department = "",
      status = "active",
    } = req.body;

    // 检查用户权限
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "没有权限执行此操作" });
    }

    // 检查用户名是否已存在
    const [existing] = await getPool().execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "用户名已存在" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await getPool().execute(
      `INSERT INTO users (
        username, password, role, real_name, email, phone, department, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        role,
        real_name,
        email,
        phone,
        department,
        status,
      ]
    );

    res.status(201).json({ message: "用户创建成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 更新用户
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, role, real_name, email, phone, department, status } =
      req.body;

    // 检查用户权限
    if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: "没有权限执行此操作" });
    }

    // 构建更新语句
    let sql = "UPDATE users SET";
    const params = [];
    const updates = [];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(" password = ?");
      params.push(hashedPassword);
    }

    if (role && req.user.role === "admin") {
      updates.push(" role = ?");
      params.push(role);
    }

    if (real_name !== undefined) {
      updates.push(" real_name = ?");
      params.push(real_name);
    }

    if (email !== undefined) {
      updates.push(" email = ?");
      params.push(email);
    }

    if (phone !== undefined) {
      updates.push(" phone = ?");
      params.push(phone);
    }

    if (department !== undefined) {
      updates.push(" department = ?");
      params.push(department);
    }

    if (status !== undefined && req.user.role === "admin") {
      updates.push(" status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "没有提供要更新的字段" });
    }

    sql += updates.join(",") + " WHERE id = ?";
    params.push(id);

    await getPool().execute(sql, params);
    res.json({ message: "用户更新成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 删除用户
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 检查用户权限
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "没有权限执行此操作" });
    }

    // 不允许删除自己
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: "不能删除当前登录用户" });
    }

    await getPool().execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "用户删除成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await getPool().execute(
      "SELECT * FROM users WHERE username = ? AND status = 'active'",
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "用户名或密码错误" });
    }

    // 更新最后登录时间
    await getPool().execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        real_name: user.real_name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 验证旧密码
    const [users] = await getPool().execute(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "用户不存在" });
    }

    const validPassword = await bcrypt.compare(oldPassword, users[0].password);
    if (!validPassword) {
      return res.status(400).json({ error: "旧密码错误" });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await getPool().execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "密码修改成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
