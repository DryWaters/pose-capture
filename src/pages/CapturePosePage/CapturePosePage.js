import React, { Component } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import * as posenet from "@tensorflow-models/posenet";
import Layout from "../../components/Layout/Layout";
import {
  drawKeyPoints,
  drawSkeleton,
  processPose,
  drawBoundingBox
} from "../../utils/poseUtils";
import Moment from "moment";

import styles from "./CapturePosePage.module.css";

class NewRecordingPage extends Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();
    this.otherCanvasRef = React.createRef();
    this.state = {
      poseNet: {
        showVideo: true,
        showDebug: false,
        flipHorizontal: true,
        imageScaleFactor: 0.5,
        outputStride: 16,
        minPoseConfidence: 0.1,
        minPartConfidence: 0.5,
        debugColor: "#f45342",
        debugBoxColor: "blue",
        debugWidth: 5
      },
      recorderSetup: false,
      recorderState: "inactive",
      videoState: "recording",
      width: 640,
      height: 480,
      videos: [],
    };
  }

  async componentDidMount() {
    await this.loadVideo();
    await this.setupRecorder();
    this.setState({
      recorderSetup: true
    });
  }

  componentWillUnmount() {
    this.videoRef.current.pause();
    const tracks = this.currentStream.getTracks();
    tracks.forEach(track => track.stop());
    this.videoRef.current = null;
    this.canvasRef.current = null;
  }

  setupRecorder = async () => {
    this.mediaRecorder = await new MediaRecorder(this.currentStream, {
      mimeType: "video/webm; codecs=vp9"
    });
    this.mediaRecorder.ondataavailable = this.handleRecordVideo;
    this.mediaRecorder.onstop = this.handleStopRecord;
    this.currentVideo = [];
  };

  handleRecordVideo = blob => {
    this.currentVideo.push(blob.data);
  };

  handleStopRecord = async () => {
    await this.setState(prevState => {
      const currentVideos = [...prevState.videos];
      const newVideo = {
        src: window.URL.createObjectURL(
          new Blob(this.currentVideo, { mimeType: "video/webm; codecs=vp9" })
        ),
        screenShot: this.canvasRef.current
          .toDataURL("image/png")
          .replace("image/png", "image/octet-stream"),
        timeStamp: new Moment().format(),
        synced: false
      };
      currentVideos.push(newVideo);
      this.currentVideo = [];

      return {
        videos: currentVideos
      };
    });
  };

  setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Newer browser required to use ShadowCam");
    }
    this.videoRef.current.width = this.state.width;
    this.videoRef.current.height = this.state.height;
    this.currentStream = await navigator.mediaDevices.getUserMedia({
      mimeType: "video/webm; codecs=vp9",
      audio: false,
      video: {
        facingMode: "user",
        width: this.state.width,
        height: this.state.height
      }
    });

    this.videoRef.current.srcObject = this.currentStream;
    return new Promise(resolve => {
      this.videoRef.current.onloadedmetadata = () => {
        resolve(this.videoRef.current);
      };
    });
  };

  loadVideo = async () => {
    this.videoRef.current = await this.setupCamera();
    if (this.videoRef.current) {
      this.videoRef.current.play();
      this.paintToCanvas();
    }
  };

  paintToCanvas = async () => {
    const ctx = this.canvasRef.current.getContext("2d");
    this.canvasRef.current.width = this.state.width;
    this.canvasRef.current.height = this.state.height;
    const net = await posenet.load(0.75);

    const poseDetectionFrame = async () => {
      let pose;
      if (this.videoRef.current) {
        pose = await net.estimateSinglePose(
          this.videoRef.current,
          this.state.poseNet.imageScaleFactor,
          this.state.poseNet.flipHorizontal,
          this.state.poseNet.outputStride
        );
        const punchType = processPose(pose);
        if (punchType !== "no_punch") {
          // debounceUpdateState(punchType);
        }
      }

      ctx.clearRect(0, 0, this.state.width, this.state.height);

      if (this.state.poseNet.showVideo) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-this.state.width, 0);
        if (this.videoRef.current) {
          ctx.drawImage(
            this.videoRef.current,
            0,
            0,
            this.state.width,
            this.state.height
          );
        }
        ctx.restore();
      }

      if (this.state.poseNet.showDebug) {
        if (pose.score > this.state.poseNet.minPoseConfidence) {
          drawKeyPoints(
            pose.keypoints,
            this.state.poseNet.minPartConfidence,
            this.state.poseNet.debugColor,
            ctx
          );
          drawSkeleton(
            pose.keypoints,
            this.state.poseNet.minPartConfidence,
            this.state.poseNet.debugColor,
            this.state.poseNet.debugWidth,
            ctx
          );
          drawBoundingBox(
            pose.keypoints,
            ctx,
            this.state.poseNet.debugBoxColor
          );
        }
      }

      if (this.videoRef.current && !this.videoRef.current.paused) {
        requestAnimationFrame(poseDetectionFrame);
      }
    };

    poseDetectionFrame();
  };

  setRecordingState = ({ id }) => {
    if (this.state.recorderState === "inactive" && id === "record") {
      this.mediaRecorder.start();
    } else if (this.state.recorderState === "recording" && id === "stop") {
      this.mediaRecorder.stop();
    } else if (this.state.recorderState === "recording" && id === "pause") {
      this.mediaRecorder.pause();
    } else if (this.state.recorderState === "paused" && id === "pause") {
      this.mediaRecorder.resume();
    }

    this.setState({
      recorderState: this.mediaRecorder.state
    });
  };

  toggleShowDebug = () => {
    this.setState(prevState => ({
      poseNet: { ...prevState.poseNet, showDebug: !prevState.poseNet.showDebug }
    }));
  };

  handleClickPlayRecordedVideo = timeStamp => {
    this.setState({
      videoState: "playing"
    });
    const correctVideo = this.state.videos.filter(
      video => video.timeStamp === timeStamp
    );
    this.videoRef.current.srcObject = null;
    this.videoRef.current.src = null;
    this.videoRef.current.src = correctVideo[0].src;
    this.videoRef.current.currentTime = 0;
    this.videoRef.current.play();
    this.paintToCanvas();
  };

  handleClickRecordVideos = () => {
    this.setState({
      videoState: "recording"
    });
    this.videoRef.current.src = null;
    this.videoRef.current.srcObject = null;
    this.videoRef.current.srcObject = this.currentStream;
    this.videoRef.current.play();
    this.paintToCanvas();
  };

  handleUploadVideo = timeStamp => {
    // fetch upload video
    // if successful change to check mark
    // else stay unchecked

    this.setState(prevState => {
      const oldVideos = prevState.videos.slice();
      oldVideos.find(video => video.timeStamp === timeStamp).synced = true;
      return {
        videos: oldVideos
      };
    });
  };

  render() {
    const displayRecordControls = () => {
      if (!this.state.recorderSetup) {
        return;
      }

      if (this.state.recorderState === "inactive") {
        return (
          <Col className={styles.videoButtonContainer}>
            <Button
              className={styles.videoControl}
              onClick={() => this.setRecordingState({ id: "record" })}
            >
              Record
            </Button>
            {/* Test Button for saving videos for testing <Button
              className={styles.videoControl}
              onClick={() => this.handleSaveRecordedVideo()}
            >
              Save Image
            </Button> */}
          </Col>
        );
      } else {
        return (
          <Col className={styles.videoButtonContainer}>
            <Button
              className={styles.videoControl}
              onClick={() => this.setRecordingState({ id: "pause" })}
            >
              {this.state.recorderState === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button
              className={styles.videoControl}
              onClick={() => this.setRecordingState({ id: "stop" })}
            >
              Stop
            </Button>
          </Col>
        );
      }
    };

    const displayPlayerControls = () => {
      return (
        <Col className={styles.videoButtonContainer}>
          <Button
            className={styles.videoControl}
            onClick={this.handleClickRecordVideos}
          >
            Record New Video
          </Button>
        </Col>
      );
    };

    const displayPoses = () => {
      return this.state.videos.map(video => {
        return (
          <div className={styles.recordedVideoContainer} key={video.timeStamp}>
            <img
              className={styles.recordedVideo}
              src={video.screenShot}
              height="75px"
              alt="Recording Video"
              onClick={() => this.handleClickPlayRecordedVideo(video.timeStamp)}
            />
            <div
              className={styles.videoStatus}
              onClick={() => this.handleUploadVideo(video.timeStamp)}
            >
              {video.synced ? "\u{2705}" : "\u{274C}"}
            </div>
          </div>
        );
      });
    };

    return (
      <Layout>
        <Container className={styles.newRecordingContainer}>
          <Row>
            <Col className={styles.debugContainer}>
              <Button onClick={this.toggleShowDebug}>Show Debug Lines</Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <video
                ref={this.videoRef}
                srcobject={this.currentStream}
                className={styles.video}
              />
              <canvas
                className={`${styles.canvas} ${
                  this.state.recorderState === "recording"
                    ? styles.videoRecording
                    : styles.notRecording
                }`}
                ref={this.canvasRef}
              />
            </Col>
          </Row>
          <Row>
            {this.state.videoState === "playing"
              ? displayPlayerControls()
              : displayRecordControls()}
          </Row>
          <Row>
            <Col className={styles.recordedPosesContainer}>
              {displayPoses()}
            </Col>
          </Row>
        </Container>
      </Layout>
    );
  }
}

export default NewRecordingPage;
