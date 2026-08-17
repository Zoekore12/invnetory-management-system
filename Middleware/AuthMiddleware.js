const jwt = require("jsonwebtoken");

const authMiddleware = (req,res, next) =>{
    try{
        const authHead = req.headers.authorization;
        if(!authHead || !authHead.startsWith("Bearer ")){
            return res.status(401).json({
                Success: false,
                message: "Unauthorized access,Authentication Required"
            });
        }
        const token = authHead.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(error){
        return res.status(401).json({
            success : false,
            message :"Invalid or Expired token,please Login Again"
        });
    }
}

module.exports = authMiddleware;