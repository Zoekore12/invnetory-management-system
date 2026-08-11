const Activity = require("../Models/Activity");

exports.logActivity = async({
    userId,
    action,
    description,
    resource,
    resourceId,
    data,
    session
})=>{
    const activity = new Activity({
        userId,
        action,
        description,
        resource,
        resourceId,
        data
    });
    await activity.save({ session });
    return activity;
}

//Get all activities
exports.getActivities = async (req, res) => {
    try {
        const {
            userId,
            action,
            resource
        } = req.query;

        const filter = {};

        if (userId) {
            filter.userId = userId;
        }

        if (action) {
            filter.action = action;
        }

        if (resource) {
            filter.resource = resource;
        }

        const activities = await Activity.find(filter)
            .populate("userId", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            activities
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching activities",
            error: error.message
        });
    }
};