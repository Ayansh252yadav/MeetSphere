import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RestoreIcon from '@mui/icons-material/Restore';
import { Button, IconButton, TextField } from '@mui/material';
import conference from '../assets/conference.svg'
import { addToUserHistory, getHistory } from '../utils/GetHistoryOfUser'
import styles from './css/Home.module.css'

const Home = () => {
  let [meetingCode, setMeetingCode] = useState("");
  const navigate = useNavigate();

  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode)
    navigate(`/${meetingCode}`)
  }

  return (
    <div className={styles.container}>
      <div className={styles.navbar}>
        <div>
          <h2>Join room to meet your loved Ones</h2>
        </div>
        <div className={styles.navButtons}>
          <IconButton onClick={() => navigate("/history")}>
            <RestoreIcon />
            <p>History</p>
          </IconButton>
          <Button onClick={() => {
            localStorage.removeItem("token")
            navigate("/get-started")
          }}>LogOut</Button>
        </div>
      </div>

      <div className={styles.meetcontainer}>
        <div className={styles.leftPanel}>
          <h3>Providing Quality video call support</h3>
          <div className={styles.joinBox}>
            <TextField
              onChange={(e) => setMeetingCode(e.target.value)}
              id="outlined-basic"
              label="meeting code"
              variant="outlined"
              className={styles.textField}
            />
            <Button color='success' variant="contained" onClick={handleJoinVideoCall}>
              Join
            </Button>
          </div>
        </div>
        <div className={styles.rightPanel}>
          <img src={conference} alt="video conference illustration" />
        </div>
      </div>
    </div>
  )
}

export default Home