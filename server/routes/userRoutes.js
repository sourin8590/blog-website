const { Router } = require("express");
const router = Router();

const {
  registerUser,
  loginUser,
  getUser,
  changeAvatar,
  editUser,
  getAuthors,
} = require("../controllers/userControllers");
const authMiddlware = require("../middleware/authMiddleware")


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUser)
router.get('/', getAuthors);
router.post('/change-avatar', authMiddlware, changeAvatar);
router.patch('/edit-user', authMiddlware, editUser);

module.exports = router;
