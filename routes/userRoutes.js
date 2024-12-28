const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

router.post("/login", userController.login);
router.get("/", auth, adminAuth, userController.getUsers);
router.post("/", auth, adminAuth, userController.createUser);
router.put("/:id", auth, userController.updateUser);
router.delete("/:id", auth, adminAuth, userController.deleteUser);
router.post("/change-password", auth, userController.changePassword);

module.exports = router;
