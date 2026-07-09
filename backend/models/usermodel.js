const mongoose=require("mongoose")

const userSchema=require('../schema/userShema');

const usermodel=mongoose.model("user",userSchema);

module.exports=usermodel;