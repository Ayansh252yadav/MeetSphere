import React from "react";
import "./css/landingPage.css";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/get-started");
  };

  const onLogin = () => {
    navigate("/get-started");
  };

  const onSignUp = () => {
    navigate("/get-started");
  };

  return (
    <div className="landingbackground">
      <nav>
        <div className="navHeader"></div>

        <div className="navList">
          <p onClick={
            ()=>{
              navigate("/dsklfj");
            }
          }>Join as Guest</p>

          <p onClick={onSignUp} style={{ cursor: "pointer" }}>
            Sign Up
          </p>

          <button onClick={onLogin}>
            Login
          </button>
        </div>
      </nav>

      <div className="landingContainer">
        <div className="leftData">
          <h1>
            <span>Connect</span> with your
            <br />
            Loved Ones
          </h1>

          <p>Cover the distance with MeetSphere</p>

          <button onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        <div className="rightData"></div>
      </div>
    </div>
  );
};

export default Landing;