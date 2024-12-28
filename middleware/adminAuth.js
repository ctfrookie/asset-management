module.exports = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
};
