import axios from "axios";


let getHistory=async()=>{
     const token =localStorage.getItem("token");
    try{
     let request=await axios.get("http://localhost:8080/get_all_activity",{
       params:{
        token:localStorage.getItem("token")
       }
     }) ;
     console.log("Token:", token);
     return request.data; 
    }catch(err){
        console.log(err);
    }
   }

  const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");
    console.log("Token:", token);
    try {
        const req = await axios.post(
            "http://localhost:8080/add_to_activity",
            {
                token,
                meetingCode,
            }
        );

        return req.data;
    } catch (err) {
        console.log(err);
    }
};
   export { getHistory, addToUserHistory };