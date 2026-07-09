import React, { useState, useEffect } from 'react'
import { getHistory } from '../utils/GetHistoryOfUser'
import { useNavigate } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import styles from './css/History.module.css'

const History = () => {

    const [meetings, setMeetings] = useState([])
    const navigate = useNavigate();

   useEffect(() => {
    const fetchHistory = async () => {
        try {
            const history = await getHistory();
            setMeetings(Array.isArray(history) ? history : []);
        } catch (err) {
            console.log(err);
            setMeetings([]);
        }
    }
    fetchHistory();
}, [])

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0")
        const year = date.getFullYear();
        return `${day}/${month}/${year}`
    }

    return (
       <div className={styles.container}>
            <div className={styles.header}>
                <IconButton onClick={() => navigate("/home")}>
                    <HomeIcon />
                </IconButton>
                <Typography variant="h6">Meeting History</Typography>
            </div>

            <div className={styles.grid}>
                {meetings.length !== 0 ? (
                    meetings.map((e, i) => (
                        <Card key={i} variant="outlined" className={styles.card}>
                            <CardContent>
                                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                    Code: {e.meetingCode}
                                </Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Date: {formatDate(e.date)}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Typography className={styles.empty} color="text.secondary">
                        No meeting history yet.
                    </Typography>
                )}
            </div>
        </div>
    )
}

export default History