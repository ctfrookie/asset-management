const { getPool } = require("../config/database");

exports.getCategories = async (req, res) => {
  try {
    const [categories] = await getPool().execute("SELECT * FROM categories");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await getPool().execute(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description]
    );

    res.status(201).json({
      message: "分类创建成功",
      categoryId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    await getPool().execute(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    res.json({ message: "分类更新成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await getPool().execute("DELETE FROM categories WHERE id = ?", [id]);
    res.json({ message: "分类删除成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
