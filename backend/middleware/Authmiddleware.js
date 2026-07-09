const jwt=require("jsonwebtoken");

const verifyUser = (req, res, next) => {
     const token = req.body?.token || req.query?.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authenticated",
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEy);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        })
    }
}
module.exports=verifyUser;