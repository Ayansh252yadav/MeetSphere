import React from 'react'
import SignUp from './SignUp'
import banner from '../assets/banner-step-1.DTtJ7nly.png'
import "./css/AuthSignup.css";
import FeatureCard from './FeatureCard';
const SignUpAuthentication = ({ changePage }) => {
  return (
     <div className="h-screen w-screen flex overflow-hidden">
        
          <div className="hidden md:flex w-1/2 h-full items-center justify-center  relative overflow-hidden select-none">
        
            <div className="absolute inset-30">
            <img className='img'  src={banner} alt="" />
            <FeatureCard/>
            </div>
          </div>
    
         
          <div className="w-full md:w-1/2 h-full flex items-center justify-center bg-gray-100 p-8 overflow-y-auto">
          
            <div className="w-full max-w-md mx-auto">
              <SignUp changePage={changePage}/>
            </div>
          </div>
    
        </div>
  )
}

export default SignUpAuthentication
