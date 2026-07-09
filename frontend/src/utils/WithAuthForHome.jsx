import { Navigate } from "react-router-dom";

const WithAuthForHome = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/get-started" replace />;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        // exp is in seconds, Date.now() is milliseconds
        if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem("token");
            return <Navigate to="/get-started" replace />;
        }

        return children;
    } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("token");
        return <Navigate to="/get-started" replace />;
    }
};

export default WithAuthForHome;