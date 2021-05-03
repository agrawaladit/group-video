import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";
import styled from "styled-components";
import {useParams} from "react-router";
import {Box, Grid, makeStyles, Menu, MenuItem} from "@material-ui/core";
import GameLovers from "./GameLovers/GameLovers";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Remote from '../assets/remote.png';
import VideocamIcon from '@material-ui/icons/Videocam';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import MicIcon from '@material-ui/icons/Mic';
import MicOffIcon from '@material-ui/icons/MicOff';
// import ChatRoom from "./ChatRoom";

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
      ref.current.srcObject = props.stream;
    }, []);

    /**
    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);
    */

    return (
        <StyledVideo playsInline autoPlay muted ref={ref} />
    );
}

const StyledVideo = styled.video`
    width: 100%;
    height: 480;
`;

const useStyles = makeStyles((theme) => ({
    centerAlign: {
        display: "flex",
        justifyContent: "center",
        padding: "5px"
    },
    videoOptions: {
        display: "flex",
        justifyContent: "center",
        width: "100%",
    },
    logo: {
        flexGrow: 1,
    },
    button: {
        color: "white",
        fontFamily: "'Press Start 2P', cursive",
        marginLeft: "40px",
    },
    gameFont: {
        fontFamily: "'Press Start 2P', cursive",
    }
}));

const Room = (props) => {
    const [streams, setStreams] = useState([]);
    const [mic, setMic] = useState(true);
    const [camera, setCamera] = useState(true);
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [game, updateGame] = React.useState("SpaceTime");
    const classes = useStyles();
    const peerRef = useRef(null);
    const socketRef = useRef();
    const userVideo = useRef();
    const { id } = useParams();
    const roomID = id;

    useEffect(() => {
        socketRef.current = io.connect("/");

        const videoConstraints = { "width": 340, "height": 255 };
        let mediaPromise = navigator.mediaDevices.getUserMedia({ audio: true });
        // let mediaPromise = navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: true });
        mediaPromise.then(localStream => {

            if (localStream) {
              userVideo.current.srcObject = localStream;
            }

            socketRef.current.emit("join room", roomID);

            const peer = localStream ? new Peer({
                initiator: false,
                trickle: false,
                stream: localStream,
            }) : new Peer({initiator: false, trickle: false, });

            peer.on('signal', signal => {
              socketRef.current.emit('returning signal', signal);
            });

            peer.on('stream', stream => {
              console.log('new stream');
              setStreams(streams => [...streams, stream]);
            });

            peer.on('connect', () => {
              console.log('connected')
            })

            socketRef.current.on("sending signal", signal => {
              console.log('received signal from remote');
              peer.signal(signal);
            });

            socketRef.current.on("user left", leavingStreamId => {
              console.log('user left');
              setStreams(streams => { return streams.filter(s => s.id !== leavingStreamId); });
            });

            peerRef.current = peer;
            /**
            socketRef.current.on("all users", users => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socketRef.current.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push({
                        peerID: userID,
                        peer,
                    });
                })
                setPeers(peers);
            });

            socketRef.current.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                const peerObj = {
                    peerID: payload.callerID,
                    peer,
                }

                setPeers(users => [...users, peerObj]);
            });

            socketRef.current.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socketRef.current.on("user left", id => {
                const peerObj = peersRef.current.find(p => p.peerID === id);
                if (peerObj) {
                    peerObj.peer.destroy();
                }
                const peers = peersRef.current.filter(p => p.peerID !== id);
                peersRef.current = peers;
                setPeers(peers);
            });
            */
        });

      return function cleanup() {
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      }
    }, []);

    /**
    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socketRef.current.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socketRef.current.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }
    */

    const isMenuOpen = Boolean(anchorEl);

    const handleMicClick = (e) => {
        userVideo.current.srcObject.getAudioTracks()[0].enabled = !mic;
        setMic(!mic);
    }

    const handleCameraClick = (e) => {
        userVideo.current.srcObject.getVideoTracks()[0].enabled = !camera;
        setCamera(!camera);
    }

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const selectGame = (game) => {
        const { myValue } = game;
        handleMenuClose();
        updateGame(myValue);
    }

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        id={menuId}
        keepMounted
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={isMenuOpen}
        onClose={handleMenuClose}
      >
          <MenuItem onClick={(e) => selectGame(e.currentTarget.dataset)} className={classes.gameFont} data-my-value={"BroForce"}>BROFORCE</MenuItem>
          <MenuItem onClick={(e) => selectGame(e.currentTarget.dataset)} className={classes.gameFont} data-my-value={"SpaceTime"}>SPACETIME</MenuItem>
      </Menu>
    );

    console.log(streams);

    return (
      <div style={{height: "100vh"}}>
          <AppBar position="static" style={{backgroundColor: "#2b2b2b"}}>
              <Toolbar>
                  <Box className={classes.logo}>
                      <img src={Remote} style={{height: "60px"}}/>
                  </Box>
                  <Button className={classes.button}>
                      START NEW GAME
                  </Button>
                  <Button className={classes.button}>
                      CHAT
                  </Button>
                  <Button
                    className={classes.button}
                    aria-label="account of current user"
                    aria-controls={menuId}
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                  >
                      SELECT GAME
                  </Button>
              </Toolbar>
          </AppBar>
          {renderMenu}
          <Grid container style={{height: "calc(100% - 64px)"}}>
              <Grid item xs={10} className={classes.centerAlign}>
                  <GameLovers roomId={roomID} gameId={game}/>
              </Grid>
              <Grid item xs={2} container direction={"column"} className={classes.centerAlign}>
                  <StyledVideo muted ref={userVideo} autoPlay playsInline />
                  {streams.map((stream) => {
                      return (
                        <Video key={stream.id} stream={stream} />
                      );
                  })}
              </Grid>
              <Grid className={classes.videoOptions}>
                  {
                      mic ? (
                        <MicIcon onClick={handleMicClick} style={{ color: 'white', fontSize: 45, marginRight: 15 }}/>
                      ) : (
                        <MicOffIcon onClick={handleMicClick} style={{ color: 'red', fontSize: 45, marginRight: 15 }}/>
                      )
                  }
                  {
                      camera ? (
                        <VideocamIcon onClick={handleCameraClick} style={{ color: 'white', fontSize: 45, marginLeft: 15 }}/>
                      ) : (
                        <VideocamOffIcon onClick={handleCameraClick} style={{ color: 'red', fontSize: 45, marginLeft: 15 }}/>
                      )
                  }
              </Grid>
          </Grid>
      </div>
    );
};

export default Room;
