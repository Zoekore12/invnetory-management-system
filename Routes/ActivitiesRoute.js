const express = require("express");
const router = express.Router();

const authMiddleware = require("../Middleware/authMiddleware");
const approvedRoles = require("../Middleware/ApprovedRole");

const {
    getActivities
} = require("../Controllers/activityController");

// SuperAdmin viewing all activities
router.get(
    "/getActivities",
    authMiddleware,
    approvedRoles("SuperAdmin"),
    getActivities
);

module.exports = router;