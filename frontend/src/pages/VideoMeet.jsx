import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../enviroment";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState([]);

  let [audio, setAudio] = useState();

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(3);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // TODO
  // if(isChrome() === false) {

  // }

  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  }, []);

  let getDislayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDislayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE HAS ", video, audio);
    }
  }, [video, audio]);
  let getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          for (let id in connections) {
            connections[id].addStream(window.localStream);

            connections[id].createOffer().then((description) => {
              connections[id]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id,
                    JSON.stringify({ sdp: connections[id].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }),
    );
  };

  let getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  let getDislayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }

          let blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          // Wait for their video stream
          // connections[socketListId].onaddstream = (event) => {
          //   console.log("BEFORE:", videoRef.current);
          //   console.log("FINDING ID: ", socketListId);

          //   let videoExists = videoRef.current.find(
          //     (video) => video.socketId === socketListId,
          //   );

          //   if (videoExists) {
          //     console.log("FOUND EXISTING");

          //     // Update the stream of the existing video
          //     setVideos((videos) => {
          //       const updatedVideos = videos.map((video) =>
          //         video.socketId === socketListId
          //           ? { ...video, stream: event.stream }
          //           : video,
          //       );
          //       videoRef.current = updatedVideos;
          //       return updatedVideos;
          //     });
          //   } else {
          //     // Create a new video
          //     console.log("CREATING NEW");
          //     let newVideo = {
          //       socketId: socketListId,
          //       stream: event.stream,
          //       autoplay: true,
          //       playsinline: true,
          //     };

          //     setVideos((videos) => {
          //       const updatedVideos = [...videos, newVideo];
          //       videoRef.current = updatedVideos;
          //       return updatedVideos;
          //     });
          //   }
          // };
          connections[socketListId].onaddstream = (event) => {
            setVideos((prevVideos) => {
              const alreadyExists = prevVideos.some(
                (v) => v.socketId === socketListId,
              );

              if (alreadyExists) {
                // update stream only
                return prevVideos.map((v) =>
                  v.socketId === socketListId
                    ? { ...v, stream: event.stream }
                    : v,
                );
              }

              // add new video only once
              return [
                ...prevVideos,
                {
                  socketId: socketListId,
                  stream: event.stream,
                },
              ];
            });
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription }),
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  // let handleVideo = () => {
  //   setVideo(!video);
  //   getUserMedia();
  // };
  // let handleAudio = () => {
  //   setAudio(!audio);
  //   getUserMedia();
  // };
  let handleVideo = () => {
    const newVideoState = !video;
    setVideo(newVideoState);

    if (window.localStream) {
      // Find video tracks and enable/disable them
      window.localStream.getVideoTracks().forEach((track) => {
        track.enabled = newVideoState;
      });
    }
  };

  let handleAudio = () => {
    const newAudioState = !audio;
    setAudio(newAudioState);

    if (window.localStream) {
      // Find audio tracks and enable/disable them
      window.localStream.getAudioTracks().forEach((track) => {
        track.enabled = newAudioState;
      });
    }
  };
  useEffect(() => {
    if (screen !== undefined) {
      getDislayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    try {
      let tracks = localVideoref.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {}
    window.location.href = "/";
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  let sendMessage = () => {
    console.log(socketRef.current);
    socketRef.current.emit("chat-message", message, username);
    setMessage("");

    // this.setState({ message: "", sender: username })
  };

  let connect = () => {
    setAskForUsername(false);
    getMedia();
  };
  return (
    <div
      style={{ height: "100vh", backgroundColor: "#0f0f0f", color: "white" }}
    >
      {askForUsername ? (
        /* =================== LOBBY =================== */
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <h2>Join Meeting</h2>

          <TextField
            label="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ background: "white", borderRadius: "6px" }}
          />

          <Button variant="contained" onClick={connect}>
            Join
          </Button>

          <video
            ref={localVideoref}
            autoPlay
            muted
            style={{
              width: "260px",
              marginTop: "20px",
              borderRadius: "10px",
              background: "black",
            }}
          />
        </div>
      ) : (
        /* =================== MEETING =================== */
        <div style={{ height: "100%", display: "flex" }}>
          {/* =================== VIDEO AREA =================== */}
          <div style={{ flex: 1, position: "relative" }}>
            {/* Remote videos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "12px",
                padding: "12px",
              }}
            >
              {videos.map((video) => (
                <video
                  key={video.socketId}
                  ref={(ref) => {
                    if (ref && video.stream) ref.srcObject = video.stream;
                  }}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "220px",
                    borderRadius: "10px",
                    background: "black",
                    objectFit: "cover",
                  }}
                />
              ))}
            </div>

            {/* Local video (PiP) */}
            <video
              ref={localVideoref}
              autoPlay
              muted
              style={{
                position: "absolute",
                bottom: "90px",
                right: showModal ? "280px" : "20px",

                width: "220px",
                height: "140px",
                borderRadius: "12px",
                border: "2px solid #444",
                objectFit: "cover",
                background: "black",
              }}
            />
          </div>

          {/* =================== CHAT PANEL =================== */}
          {showModal && (
            <div
              style={{
                position: "fixed",
                right: 0,
                top: 0,
                width: "260px", // 👈 reduced width
                height: "calc(100vh - 70px)", // 👈 above icons
                background: "#1c1c1c",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid #333",
                zIndex: 10,
              }}
            >
              {/* CHAT HEADER */}
              <div
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #333",
                  fontWeight: "bold",
                }}
              >
                Chat
              </div>

              {/* CHAT MESSAGES */}
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  overflowY: "auto",
                  fontSize: "14px",
                }}
              >
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: "10px" }}>
                    <strong>{msg.sender}</strong>
                    <div>{msg.data}</div>
                  </div>
                ))}
              </div>

              {/* CHAT INPUT (INSIDE PANEL) */}
              <div
                style={{
                  padding: "8px",
                  borderTop: "1px solid #333",
                  display: "flex",
                  gap: "6px",
                  background: "#111",
                }}
              >
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type message..."
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "4px",
                    border: "none",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    padding: "6px 10px",
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* =================== CONTROLS =================== */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              width: "100%",
              height: "70px",
              background: "#1a1a1a",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "25px",
              borderTop: "1px solid #333",
            }}
          >
            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} color="error">
              <IconButton
                onClick={() => setModal(!showModal)}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
