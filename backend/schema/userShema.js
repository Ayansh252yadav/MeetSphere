const mongoose=require("mongoose");

const userShema=new mongoose.Schema({
    name:{type:String,required:true},
    username:{type:String ,required :true ,unique:true},
    password:{type:String ,required:true},
    token:{type:String}
});



module.exports=userShema;