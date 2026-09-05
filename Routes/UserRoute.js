const express = require('express');
const router = express.Router();

//importing middleware
const upload = require("../Middleware/upload");
const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");

//importing controller 
const {registerUser,createUser,loginUser,updateUserProfile,refreshToken,verifyEmail,updateProfilePicture,reactivateUser,deactivateUser,logOutUser}= require("../Controllers/UserController");
//importing role-controller
const {changeUserRole} = require("../Controllers/RoleController");

//define routes
router.post("/registerUser",upload.single("profilePic"), registerUser);
router.post("/loginUser", loginUser);
router.put("/updateUserProfile/:userId",
    authMiddleware,
    upload.single("profilePic"),
    updateUserProfile);
router.post("/createUser",
    authMiddleware,
    approvedRoles("Admin","SuperAdmin"),
    upload.single("profilePic"),
     createUser);

router.put("/changeUserRole/:userId",
    authMiddleware,
    approvedRoles("SuperAdmin"),
    changeUserRole
);
router.post("/refreshToken", refreshToken);

router.post("/verifyEmail",verifyEmail);

router.post("/logOutUser",logOutUser);

router.patch(
    "/reactivateUser/:userId",
    authMiddleware,
    approvedRoles("Admin", "SuperAdmin"),
    reactivateUser
);

router.patch(
    "/deactivateUser/:userId",
    authMiddleware,
    approvedRoles("Admin", "SuperAdmin"),
    deactivateUser
);

router.post("/updateProfilePicture",updateProfilePicture);

//export router
module.exports = router;
