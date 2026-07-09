import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Landing from './pages/Landing'
import './App.css'
import Authentication from './pages/Authentication'
import SignUpAuthentication from './pages/SignUpAuthentication'
import GetStarted from './pages/GetStarted'
import VideoMeet from './pages/VideoMeet'
import Home from './pages/Home'
import WithAuthForHome from './utils/WithAuthForHome'
import History from './pages/History'

const App = () => {
  return (
    <div>
     <Routes>
        <Route path="/" element={<Landing />} />
        {/* <Route path='/signin' element={<Authentication/>}/>
        <Route path='/signup' element={<SignUpAuthentication/>}/> */}
      <Route path="/get-started" element={<GetStarted />} />
      <Route path='/:url' element={<VideoMeet/>}/>
      <Route path='/history' element={<History/>}/>
        <Route path='/home' element={
          <WithAuthForHome>
            <Home/>
          </WithAuthForHome>
        }/>
     </Routes>
    </div>
  )
}

export default App
