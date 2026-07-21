import React, { useState, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import io from "socket.io-client";
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import { Badge, IconButton } from "@mui/material";
const server_url =  `${import.meta.env.VITE_BACKEND_URL}`

const connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};


const ChatPanel = React.memo(function ChatPanel({ messages, onSend, darkFieldSx }) {
  const [ draft, setDraft ] = useState("");

  const handleSend = () => {
    if (draft.trim() === "") return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full w-full max-w-sm flex-col border-r border-white/10 bg-slate-900/95 backdrop-blur">
      <div className="flex h-full flex-col p-4">
        <h1 className="mb-3 text-lg font-semibold">Chat</h1>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.length !== 0 ? (
            messages.map((item, index) => (
              <div key={index} className="rounded-lg bg-white/5 p-2">
                <p className="text-sm font-bold text-indigo-300">{item.sender}</p>
                <p className="text-sm text-white/90 break-words">{item.data}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/50">No Messages Yet</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            id="outlined-basic"
            label="Enter Your chat"
            variant="outlined"
            size="small"
            fullWidth
            sx={darkFieldSx}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            className="!bg-indigo-600 hover:!bg-indigo-500 !normal-case"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});



const VideoGrid = React.memo(function VideoGrid({ videos, usernames }) {
  return (
    <div className="grid h-full w-full grid-cols-1 gap-2 overflow-y-auto p-2 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <div
          key={video.socketId}
          className="relative overflow-hidden rounded-xl bg-black"
        >
          <video
            data-socket={video.socketId}
            ref={ref => {
           
              if (ref && video.stream && ref.srcObject !== video.stream) {
                ref.srcObject = video.stream;
              }
            }}
            autoPlay
            className="aspect-video w-full object-cover"
          ></video>
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs">
            {usernames[ video.socketId ] || `Participant ${video.socketId.slice(0, 5)}`}
          </span>
        </div>
      ))}
    </div>
  );
});

// Shown instead of VideoGrid whenever someone in the room is screen
// sharing. The presenter's stream fills the stage; everyone else
// (including the local user, if they aren't the presenter) is
// demoted to a small scrollable thumbnail strip along the bottom.
const FocusedStage = React.memo(function FocusedStage({ presenterStream, presenterLabel, thumbnails }) {
  return (
    <div className="flex h-full w-full flex-col bg-black">
      <div className="relative flex-1 overflow-hidden bg-black">
        <video
          ref={ref => {
            if (ref && presenterStream && ref.srcObject !== presenterStream) {
              ref.srcObject = presenterStream;
            }
          }}
          autoPlay
          className="h-full w-full object-contain"
        ></video>
        {presenterLabel && (
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-xs">
            {presenterLabel} is presenting
          </span>
        )}
      </div>

      {thumbnails.length > 0 && (
        <div className="flex w-full flex-shrink-0 gap-2 overflow-x-auto bg-slate-950/90 p-2">
          {thumbnails.map((t) => (
            <div
              key={t.socketId}
              className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-black"
            >
              <video
                ref={ref => {
                  if (ref && t.stream && ref.srcObject !== t.stream) {
                    ref.srcObject = t.stream;
                  }
                }}
                autoPlay
                muted={t.muted}
                className="h-full w-full object-cover"
              ></video>
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[10px]">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

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
  const [ newMessages, setNewMessages ] = useState(0);

  const [ askForUsername, setAskForUsername ] = useState(true);
  const [ username, setUsername ] = useState("");

  // socketId -> username map for every participant in the call
  const [ usernames, setUsernames ] = useState({});
  const usernamesRef = useRef({});

  const videoRef = useRef([]);
  const [ videos, setVideos ] = useState([]);

  // socketId of whoever is currently sharing their screen (or null).
  // Drives the full-screen "focused" presenter layout below.
  const [ screenSharingId, setScreenSharingId ] = useState(null);

  useEffect(() => {
    usernamesRef.current = usernames;
  }, [ usernames ]);

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

        if (
          signal.sdp.type === "answer" &&
          pc.signalingState !== "have-local-offer"
        ) {
          return;
        }

        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
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

  const sendMessage = (text) => {
    if (!text || text.trim() === "") return;
    socketRef.current.emit("chat-message", text, username);
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;

      socketRef.current.emit(
        "join-call",
        window.location.href,
        username
      );

      setUsernames((prev) => ({ ...prev, [ socketRef.current.id ]: username }));
    });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("chat-message", addMessage);

    socketRef.current.on("user-name", (id, name) => {
      setUsernames((prev) => ({ ...prev, [ id ]: name }));
    });

    // A peer started/stopped sharing their screen. The server should
    // relay this to everyone else in the room, echoing back the
    // sender's socket id as the first argument (same pattern as
    // "user-name" above).
    socketRef.current.on("screen-share-status", (id, isSharing) => {
      setScreenSharingId((prev) => {
        if (isSharing) return id;
        return prev === id ? null : prev;
      });
    });

    socketRef.current.on("user-left", (id) => {
      setVideos((videos) =>
        videos.filter((video) => video.socketId !== id)
      );

      if (connections[ id ]) {
        connections[ id ].close();
      }
      delete connections[ id ];

      setUsernames((prev) => {
        const next = { ...prev };
        delete next[ id ];
        return next;
      });

      setScreenSharingId((prev) => (prev === id ? null : prev));
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
        setScreenSharingId(socketIdRef.current);
        socketRef.current?.emit("screen-share-status", true);

        stream.getVideoTracks()[ 0 ].onended = () => {
          setScreen(false);
          setScreenSharingId((prev) => (prev === socketIdRef.current ? null : prev));
          socketRef.current?.emit("screen-share-status", false);
          getUserMedia();
        };

        getUserMediaSuccess(stream);
      } catch (e) {
        console.log(e);
        setScreen(false);
      }
    } else {
      setScreen(false);
      setScreenSharingId((prev) => (prev === socketIdRef.current ? null : prev));
      socketRef.current?.emit("screen-share-status", false);
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

  const darkFieldSx = {
    input: { color: "white" },
    label: { color: "rgba(255,255,255,0.6)" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.6)" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
    },
  };

  // Is the local user the one currently presenting their screen?
  const isSelfPresenting = !!screenSharingId && screenSharingId === socketIdRef.current;

  // The stream to show big on the main stage: local screen-share
  // stream if it's us, otherwise the matching remote peer's stream.
  const presenterStream = screenSharingId
    ? (isSelfPresenting
        ? window.localStream
        : videos.find((v) => v.socketId === screenSharingId)?.stream)
    : null;

  const presenterLabel = screenSharingId
    ? (isSelfPresenting
        ? (username ? `${username} (You)` : "You")
        : (usernames[ screenSharingId ] || `Participant ${screenSharingId.slice(0, 5)}`))
    : "";

  // Everyone else, shrunk down into a thumbnail strip while someone
  // is presenting. Includes the local user if they aren't the one
  // presenting.
  const thumbnails = screenSharingId
    ? [
        ...(!isSelfPresenting
          ? [ {
              socketId: socketIdRef.current || "self",
              stream: window.localStream,
              label: username ? `${username} (You)` : "You",
              muted: true,
            } ]
          : []),
        ...videos
          .filter((v) => v.socketId !== screenSharingId)
          .map((v) => ({
            socketId: v.socketId,
            stream: v.stream,
            label: usernames[ v.socketId ] || `Participant ${v.socketId.slice(0, 5)}`,
            muted: false,
          })),
      ]
    : [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">

      {askForUsername === true ? (

        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4">
          <h2 className="text-2xl font-semibold tracking-tight">Enter into Lobby</h2>

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="aspect-video w-full object-cover"
            ></video>
          </div>

          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center">
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={darkFieldSx}
            />
            <Button
              variant="contained"
              onClick={connect}
              className="!bg-indigo-600 hover:!bg-indigo-500 !normal-case"
            >
              Connect
            </Button>
          </div>
        </div>

      ) : (

        <div className="relative flex h-screen w-full overflow-hidden bg-slate-950">

          {/* Chat panel — isolated into its own component so that typing
              a message only re-renders this subtree, not the whole
              VideoMeet tree (video grid, controls, etc). */}
          {showModal && (
            <ChatPanel
              messages={messages}
              onSend={sendMessage}
              darkFieldSx={darkFieldSx}
            />
          )}

          {/* Main stage */}
          <div className="relative flex-1">

            {/* Controls — floats a little higher when the thumbnail
                strip is on screen so it doesn't get covered. */}
            <div
              className={`absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/60 px-5 py-3 backdrop-blur ${
                screenSharingId ? "bottom-28" : "bottom-6"
              }`}
            >
              <IconButton onClick={handleVideo} className="!text-white">
                {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton
                onClick={handleEndCall}
                className="!bg-red-600 hover:!bg-red-500 !text-white"
              >
                <CallEndIcon />
              </IconButton>
              <IconButton onClick={handleAudio} className="!text-white">
                {audio === true ? <MicIcon /> : <MicOffIcon />}
              </IconButton>

              {screenAvailable === true && (
                <IconButton onClick={handleScreen} className="!text-white">
                  {screen === true ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton>
              )}

              <Badge badgeContent={newMessages} max={999} color="error">
                <IconButton
                  onClick={() => { setShowModal(!showModal); setNewMessages(0); }}
                  className="!text-white"
                >
                  <ChatIcon />
                </IconButton>
              </Badge>
            </div>

            {screenSharingId ? (
              <FocusedStage
                presenterStream={presenterStream}
                presenterLabel={presenterLabel}
                thumbnails={thumbnails}
              />
            ) : (
              <>
                {/* Self video (picture-in-picture) — only shown in the
                    regular grid layout; while presenting/watching a
                    presentation, self appears in the thumbnail strip
                    or as the main stage instead. */}
                <div className="absolute bottom-24 right-6 z-20 w-40 overflow-hidden rounded-xl border border-white/20 bg-black shadow-lg sm:w-52">
                  <video
                    className="aspect-video w-full object-cover"
                    ref={localVideoRef}
                    autoPlay
                    muted
                  ></video>
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs">
                    {username ? `${username} (You)` : "You"}
                  </span>
                </div>

                <VideoGrid videos={videos} usernames={usernames} />
              </>
            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default VideoMeet;