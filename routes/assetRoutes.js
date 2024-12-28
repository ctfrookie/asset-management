const express = require("express");
const router = express.Router();
const multer = require("multer");
const assetController = require("../controllers/assetController");
const auth = require("../middleware/auth");

// 配置文件上传
const upload = multer({ dest: "uploads/" });

router.get("/", auth, assetController.getAssets);
router.post("/", auth, assetController.createAsset);
router.put("/:id", auth, assetController.updateAsset);
router.delete("/:id", auth, assetController.deleteAsset);
router.get("/export", auth, assetController.exportAssets);
router.post(
  "/import",
  auth,
  upload.single("file"),
  assetController.importAssets
);

module.exports = router;
