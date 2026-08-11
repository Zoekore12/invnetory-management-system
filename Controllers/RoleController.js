const User = require("../Models/User");
const { logActivity } = require("./activityController");
exports.changeUserRole  =  async (req, res) =>{
    try{
            const userId= req.params.id;
            const {role} = req.body;
            const allowedRoles = ["SuperAdmin","User","StoreKeeper","Admin","Cashier"];
            if(!allowedRoles.includes(role)){
                return res.status(400).json({
                    success: false,
                    message: "Invalid role specified"
                });
            }
            const user = await User.findByIdAndUpdate(userId,{role},{new:true,runValidators:true}).select("-password");
            if(!user){
                return res.status(404).json({
                    success:false,
                    message:"User not found"
                });
            }
                await logActivity({
                    userId: req.user.id,
                    action: "CHANGE_ROLE",
                    description: `Changed ${user.name}'s role to ${role}`,
                    resource: "User",
                    resourceId: user._id,
                    data: {
                        newRole: role
                    }
            });
            res.status(200).json({
                success:true,
                message:`User role updated successfully ${role}`,
                user
            });
    }catch(error){
        res.status(500).json({
            success:false,
            message: "Error changing user role",
            error: error.message
        });
    }
}
