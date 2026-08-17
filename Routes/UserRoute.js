const express = require('express');
const router = express.Router();

//importing middleware
const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");

//importing controller 
const {registerUser,createUser,loginUser,updateUserProfile,refreshToken,logOutUser}= require("../Controllers/UserController");
//importing role-controller
const {changeUserRole} = require("../Controllers/RoleController");

//define routes
router.post("/registerUser", registerUser);
router.post("/loginUser", loginUser);
router.put("/updateUserProfile/:id",
    authMiddleware,
    updateUserProfile);
router.post("/createUser",
    authMiddleware,
    approvedRoles("Admin","SuperAdmin"),
     createUser);
router.put("/changeUserRole/:id",
    authMiddleware,
    approvedRoles("SuperAdmin"),
    changeUserRole
);
router.post("/refreshToken", refreshToken);

router.post("/logOutUser",logOutUser);


//export router
module.exports = router;
