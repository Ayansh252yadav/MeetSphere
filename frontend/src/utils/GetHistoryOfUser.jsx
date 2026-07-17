import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

let getHistory = async () => {
    const token = localStorage.getItem("token");

    try {
        let request = await axios.get(
            `${BASE_URL}/get_all_activity`,
            {
                params: {
                    token
                },
                withCredentials: true
            }
        );

        console.log("Token:", token);
        return request.data;

    } catch (err) {
        console.log(err);
    }
};


const addToUserHistory = async (meetingCode) => {
    const token = localStorage.getItem("token");

    console.log("Token:", token);

    try {
        const req = await axios.post(
            `${BASE_URL}/add_to_activity`,
            {
                token,
                meetingCode,
            },
            {
                withCredentials: true
            }
        );

        return req.data;

    } catch (err) {
        console.log(err);
    }
};


export { getHistory, addToUserHistory };