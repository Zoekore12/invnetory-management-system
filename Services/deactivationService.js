const cron = require("node-cron");
const User = require("../models/User");

const deactivateInactiveUsers = async () => {
    try {
        const threeYearsAgo = new Date();

        threeYearsAgo.setFullYear(
            threeYearsAgo.getFullYear() - 3
        );

        const result = await User.updateMany(
            {
                isActive: true,

                $or: [
                    {
                        lastLoginAt: {
                            $ne: null,
                            $lt: threeYearsAgo
                        }
                    },
                    {
                        lastLoginAt: null,
                        createdAt: {
                            $lt: threeYearsAgo
                        }
                    }
                ]
            },
            {
                $set: {
                    isActive: false
                }
            }
        );

        console.log(
            `${result.modifiedCount} inactive accounts deactivated`
        );

    } catch (error) {
        console.error(
            "Error deactivating inactive users:",
            error
        );
    }
};


const startAccountDeactivationJob = () => {

    cron.schedule("0 0 * * *", async () => {

        console.log(
            "Checking inactive accounts..."
        );

        await deactivateInactiveUsers();

    });

    console.log(
        "Account deactivation job started"
    );
};


module.exports = startAccountDeactivationJob;