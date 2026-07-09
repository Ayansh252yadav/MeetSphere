import React, { useState, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import io from "socket.io-client";
import styles from './css/VideoComponent.module.css'
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import { Badge, IconButton } from "@mui/material";
const server_url = "http://localhost:8080";

const connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const VideoMeet = () => {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [ videoAvailable, setVideoAvailable ] = useState(true);
  const [ audioAvailable, setAudioAvailable ] = useState(true);

  const [ video, setVideo ] = useState(false);
  const [ audio, setAudio ] = useState(false);
  const [ screen, setScreen ] = useState(false);

  const [ showModal, setShowModal ] = useState(true);
  const [ screenAvailable, setScreenAvailable ] = useState(false);

  const [ messages, setMessages ] = useState([]);
  const [ message, setMessage ] = useState("");
  const [ newMessages, setNewMessages ] = useState(0);

  const [ askForUsername, setAskForUsername ] = useState(true);
  const [ username, setUsername ] = useState("");

  const videoRef = useRef([]);
  const [ videos, setVideos ] = useState([]);

 
  const getPermissions = async () => {
    try {
      const userMediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (userMediaStream) {
        window.localStream = userMediaStream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = userMediaStream;
        }
      }
    } catch (err) {
      console.log(err);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[ 0 ], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[ 0 ], { enabled: false });
  };

  const replaceTracksOnAllConnections = (newStream) => {
    for (let id in connections) {
      const pc = connections[ id ];

      const senders = pc.getSenders();
      newStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, newStream);
        }
      });

      pc.createOffer().then((description) => {
        pc.setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': pc.localDescription }));
          })
          .catch((e) => console.log(e));
      });
    }
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop());
    } catch (e) { console.log(e); }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);

      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (e) { console.log(e); }

      let blackSilence = (...args) => new MediaStream([ black(...args), silence() ]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;

      replaceTracksOnAllConnections(window.localStream);
    });

    replaceTracksOnAllConnections(stream);
  };

  const getUserMedia = () => {
    if (
      (video && videoAvailable) ||
      (audio && audioAvailable)
    ) {
      navigator.mediaDevices
        .getUserMedia({
          video: video,
          audio: audio,
        })
        .then((stream) => {
          getUserMediaSuccess(stream);
        })
        .catch((err) => console.log(err));
    } else {
      try {
        if (localVideoRef.current?.srcObject) {
          const tracks = localVideoRef.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        }
      } catch (e) { }
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [ video, audio ]);

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);

    connectToSocketServer();
  };

  const connect = () => {
    getMedia();
  };

  const gotMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        const pc = connections[ fromId ];
        if (!pc) return;

        console.log("--------------------------------");
        console.log("Received SDP:", signal.sdp.type);
        console.log("From:", fromId);
        console.log("Current signalingState:", pc.signalingState);

        if (
          signal.sdp.type === "answer" &&
          pc.signalingState !== "have-local-offer"
        ) {
          console.log("Ignoring duplicate answer");
          return;
        }

        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              console.log("Creating ANSWER for:", fromId);
              return pc.createAnswer();
            }
          })
          .then((description) => {
            if (!description) return;

            return pc.setLocalDescription(description).then(() => {
              socketRef.current.emit(
                "signal",
                fromId,
                JSON.stringify({
                  sdp: pc.localDescription,
                })
              );
            });
          })
          .catch(console.log);
      }

      if (signal.ice) {
        connections[ fromId ]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch(e => console.log(e));
      }
    }
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prev) => [ ...prev, { sender, data } ]);

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  const sendMessage = () => {
    if (message.trim() === "") return;
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      console.log("Connected:", socketRef.current.id);

      socketIdRef.current = socketRef.current.id;

      socketRef.current.emit(
        "join-call",
        window.location.href
      );
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-left", (id) => {
      setVideos((videos) =>
        videos.filter((video) => video.socketId !== id)
      );

      if (connections[ id ]) {
        connections[ id ].close();
      }
      delete connections[ id ];
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((socketListId) => {
        if (connections[ socketListId ]) return;

        connections[ socketListId ] = new RTCPeerConnection(
          peerConfigConnections
        );

        connections[ socketListId ].onicecandidate = (event) => {
          if (event.candidate != null) {
            socketRef.current.emit(
              "signal",
              socketListId,
              JSON.stringify({
                ice: event.candidate,
              })
            );
          }
        };

       
        connections[ socketListId ].ontrack = (event) => {
          const stream = event.streams[ 0 ];

          const videoExist = videoRef.current.find(
            (video) => video.socketId === socketListId
          );

          if (videoExist) {
            setVideos((videos) => {
              const updatedVideos = videos.map((video) =>
                video.socketId === socketListId
                  ? { ...video, stream }
                  : video
              );

              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          } else {
            const newVideo = {
              socketId: socketListId,
              stream,
              autoPlay: true,
              playsInline: true,
            };

            setVideos((videos) => {
              const updatedVideos = [ ...videos, newVideo ];
              videoRef.current = updatedVideos;
              return updatedVideos;
            });
          }
        };

        
        let streamToAdd = window.localStream;
        if (!streamToAdd) {
          let blackSilence = (...args) => new MediaStream([ black(...args), silence() ]);
          streamToAdd = blackSilence();
          window.localStream = streamToAdd;
        }

        streamToAdd.getTracks().forEach((track) => {
          connections[ socketListId ].addTrack(track, streamToAdd);
        });
      });

      if (id === socketIdRef.current) {
        for (let id2 in connections) {
          if (id2 === socketIdRef.current) continue;

          try {
            console.log("Creating OFFER for:", id2);
            connections[ id2 ]
              .createOffer()
              .then((description) => {
                return connections[ id2 ]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      id2,
                      JSON.stringify({
                        sdp: connections[ id2 ].localDescription,
                      })
                    );
                  });
              })
              .catch((e) => console.log(e));
          } catch (e) {
            console.log(e);
          }
        }
      }
    });

    setAskForUsername(false);
  };

  let handleVideo = () => {
    setVideo(!video);
  };

  let handleAudio = () => {
    setAudio(!audio);
  };

  let handleScreen = async () => {
    if (!screen) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreen(true);

        stream.getVideoTracks()[ 0 ].onended = () => {
          setScreen(false);
        };

        getUserMediaSuccess(stream);
      } catch (e) {
        console.log(e);
        setScreen(false);
      }
    } else {
      setScreen(false);
  
      getUserMedia();
    }
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    } catch (e) { }

    for (let id in connections) {
      connections[ id ].close();
      delete connections[ id ];
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    window.location.href = "/home";
  };

  return (
    <div>

      {askForUsername === true ?

        <div>

          <h2>Enter into Lobby </h2>
          <TextField id="outlined-basic" label="Username" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" />
          <Button variant="contained" onClick={connect}>Connect</Button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>

        </div> :

        <div className={styles.meetVideoContainer}>

          {showModal ? <div className={styles.chatRoom}>

            <div className={styles.chatContainer}>
              <h1>Chat</h1>

              <div className={styles.chattingDisplay}>

                {messages.length !== 0 ? messages.map((item, index) => {
                  return (
                    <div style={{ marginBottom: "20px" }} key={index}>
                      <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                      <p>{item.data}</p>
                    </div>
                  );
                }) : <p>No Messages Yet</p>}

              </div>

              <div className={styles.chattingArea}>
                <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your chat" variant="outlined" />
                <Button variant='contained' onClick={sendMessage}>Send</Button>
              </div>

            </div>
          </div> : <></>}

          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio === true ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable === true ?
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton> : <></>}

            <Badge badgeContent={newMessages} max={999} color='error'>
              <IconButton onClick={() => { setShowModal(!showModal); setNewMessages(0); }} style={{ color: "white" }}>
                <ChatIcon />
              </IconButton>
            </Badge>

          </div>

          <div className={styles.selfTile}>
            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
            <span className={styles.tileLabel}>{username ? `${username} (You)` : "You"}</span>
          </div>

          <div className={styles.conferenceView}>
            {videos.map((video) => (
              <div className={styles.videoTile} key={video.socketId}>
                <video
                  data-socket={video.socketId}
                  ref={ref => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                >
                </video>
                <span className={styles.tileLabel}>{`Participant ${video.socketId.slice(0, 5)}`}</span>
              </div>
            ))}
          </div>

        </div>

      }

    </div>
  );
};

export default VideoMeet;
