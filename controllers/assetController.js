const { getPool } = require("../config/database");
const excel = require("exceljs");
const path = require("path");

exports.getAssets = async (req, res) => {
  try {
    const [assets] = await getPool().execute(`
      SELECT 
        assets.*,
        categories.name as category_name,
        users.username as assigned_to_name
      FROM assets
      LEFT JOIN categories ON assets.category_id = categories.id
      LEFT JOIN users ON assets.assigned_to = users.id
    `);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAsset = async (req, res) => {
  try {
    const {
      name,
      category_id,
      status,
      ip_address = "",
      port = "",
      add_date = null,
      purchase_price = null,
      current_value = null,
      location = "",
      assigned_to = null,
      remarks = "",
    } = req.body;

    if (!name || !category_id || !status) {
      return res.status(400).json({ error: "名称、分类和状态为必填项" });
    }

    const [result] = await getPool().execute(
      `INSERT INTO assets (
        name, category_id, status, ip_address, port,
        add_date, purchase_price, current_value,
        location, assigned_to, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category_id,
        status,
        ip_address,
        port,
        add_date,
        purchase_price,
        current_value,
        location,
        assigned_to,
        remarks,
      ]
    );

    res.status(201).json({
      message: "资产创建成功",
      assetId: result.insertId,
    });
  } catch (error) {
    console.error("创建资产错误:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category_id,
      status,
      ip_address = "",
      port = "",
      purchase_date = null,
      purchase_price = null,
      current_value = null,
      location = "",
      assigned_to = null,
      remarks = "",
    } = req.body;

    if (!name || !category_id || !status) {
      return res.status(400).json({ error: "名称、分类和状态为必填项" });
    }

    await getPool().execute(
      `UPDATE assets SET 
        name = ?, category_id = ?, status = ?, ip_address = ?, port = ?,
        purchase_date = ?, purchase_price = ?, current_value = ?,
        location = ?, assigned_to = ?, remarks = ?
      WHERE id = ?`,
      [
        name,
        category_id,
        status,
        ip_address,
        port,
        purchase_date,
        purchase_price,
        current_value,
        location,
        assigned_to,
        remarks,
        id,
      ]
    );

    res.json({ message: "资产更新成功" });
  } catch (error) {
    console.error("更新资产错误:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await getPool().execute("DELETE FROM assets WHERE id = ?", [id]);
    res.json({ message: "资产删除成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportAssets = async (req, res) => {
  try {
    const [assets] = await getPool().execute(`
      SELECT 
        assets.*,
        categories.name as category_name,
        users.username as assigned_to_name
      FROM assets
      LEFT JOIN categories ON assets.category_id = categories.id
      LEFT JOIN users ON assets.assigned_to = users.id
    `);

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("资产列表");

    // 设置表头
    worksheet.columns = [
      { header: "资产名称", key: "name", width: 20 },
      { header: "分类", key: "category_name", width: 15 },
      { header: "IP地址", key: "ip_address", width: 15 },
      { header: "端口", key: "port", width: 15 },
      { header: "状态", key: "status", width: 10 },
      { header: "位置", key: "location", width: 15 },
      { header: "添加日期", key: "add_date", width: 12 },
      { header: "购买价格", key: "purchase_price", width: 12 },
      { header: "当前价值", key: "current_value", width: 12 },
      { header: "分配给", key: "assigned_to_name", width: 15 },
      { header: "备注", key: "remarks", width: 30 },
    ];

    // 添加数据
    worksheet.addRows(assets);

    // 设置响应头
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=assets.xlsx");

    // 发送文件
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.importAssets = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "请上传文件" });
    }

    const workbook = new excel.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);

    const assets = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        // 跳过表头
        const asset = {
          name: row.getCell(1).value,
          category_name: row.getCell(2).value,
          ip_address: row.getCell(3).value,
          port: row.getCell(4).value,
          status: row.getCell(5).value,
          location: row.getCell(6).value,
          add_date: row.getCell(7).value,
          purchase_price: row.getCell(8).value,
          current_value: row.getCell(9).value,
          remarks: row.getCell(10).value,
        };
        assets.push(asset);
      }
    });

    // 批量插入资产
    for (const asset of assets) {
      // 查找或创建分类
      const [categories] = await getPool().execute(
        "SELECT id FROM categories WHERE name = ?",
        [asset.category_name]
      );

      let categoryId;
      if (categories.length > 0) {
        categoryId = categories[0].id;
      } else {
        const [result] = await getPool().execute(
          "INSERT INTO categories (name) VALUES (?)",
          [asset.category_name]
        );
        categoryId = result.insertId;
      }

      // 插入资产
      await getPool().execute(
        `INSERT INTO assets (
          name, category_id, ip_address, port, status,
          location, add_date, purchase_price, current_value,
          remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          asset.name,
          categoryId,
          asset.ip_address,
          asset.port,
          asset.status,
          asset.location,
          asset.add_date,
          asset.purchase_price,
          asset.current_value,
          asset.remarks,
        ]
      );
    }

    res.json({ message: `成功导入 ${assets.length} 条资产记录` });
  } catch (error) {
    console.error("导入资产错误:", error);
    res.status(500).json({ error: error.message });
  }
};
