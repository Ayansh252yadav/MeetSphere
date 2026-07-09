const meetingModel = require('../models/meetingmodel');
const user = require('../models/usermodel');
const meetingSchema = require('../schema/MeetingSchema');
const { createSecretToken } = require('../Util/secretToken')
const bcrypt = require("bcrypt")
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }
        const existingUser = await user.findOne({ username });
        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }
       const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid username or password"
            });
        }
        const token = createSecretToken(existingUser._id);
        existingUser.token=token;
        await existingUser.save();
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            path: "/",
            maxAge: 3 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successfull",
            user: {
                _id: existingUser._id,
                name: existingUser.name,
                token:token
            }
        })
    } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
        success: false,
        message: error.message,
    });
}
    };

    const signup = async (req, res) => {
        const { name, username, password } = req.body;
        try {
            const existingUser = await user.findOne({ username });
            if (existingUser) {
                return res.json({
                    success: false,
                    message: "user Already Exists"
                });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = new user({
                name: name,
                username: username,
                password: hashedPassword
            })
            await newUser.save();
            const token = createSecretToken(newUser._id);
            res.cookie("token", token, {
                httpOnly: true,
                sameSite: "lax",
                secure: false,
                path: "/",
                maxAge: 3 * 24 * 60 * 60 * 1000,
            });
            return res.status(201).json({
                success: true,
                message: "User signed up successfully",
                 user: {
        _id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        token:token
    }
            });
        } catch (error) {
            return res.status(501).json({
                success: false,
                message: "servor error"
            })
        }
    };

   

    const getUserHistory= async(req,res)=>{
    const {token}=req.query;
    try{
        let existingUser= await user.findOne({token:token});
        if(!existingUser){
            return res.status(404).json({
                  success: false,
                message: "User not found",
            })
        }
        let meeting=await meetingModel.find({user_id:existingUser.username})
        res.json(meeting)
    }catch(err){
             res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
    }

    const addToHistory=async(req,res)=>{
        const {token,meetingCode}=req.body;
        try{
            const existingUser=await user.findOne({token:token})
             if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
            const newMeeting = await new meetingModel({
                user_id:existingUser.username,
                meetingCode:meetingCode
            })
            await newMeeting.save();
            res.status(201).json({
                success:true,
                message:" meeting code added to history",
            })
        }catch(err){
            console.log(err);
            res.status(501).json({
                success:false,
                message:"server error"
            })
        }
    }

    module.exports = {
        login,
        signup,
        addToHistory,
        getUserHistory
    };