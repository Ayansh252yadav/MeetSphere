const {
    login,
    signup,
     addToHistory,
     getUserHistory
} = require("../controllers/userController");

const verifyUser = require("../middleware/Authmiddleware");

const router = require("express").Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/add_to_activity", verifyUser, addToHistory);
router.get("/get_all_activity", verifyUser, getUserHistory);

module.exports = router;