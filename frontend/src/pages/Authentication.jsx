import React from "react";
import NetworkGlobe from "./NetworkGlobe";
import Login from "./Login";

const Authentication = ({changePage}) => {
  return (
    <div className="h-screen w-screen flex overflow-hidden">
    
      <div className="hidden md:flex w-1/2 h-full items-center justify-center bg-[#020817] relative overflow-hidden select-none">
    
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <NetworkGlobe />
        </div>
      </div>

     
      <div className="w-full md:w-1/2 h-full flex items-center justify-center bg-gray-100 p-8 overflow-y-auto">
      
        <div className="w-full max-w-md mx-auto">
          <Login changePage={changePage} />
        </div>
      </div>

    </div>
  );
};

export default Authentication;