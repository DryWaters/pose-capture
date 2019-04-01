import React, { Component } from "react";
import { Container, Row, Col, Button, Input, Label } from "reactstrap";
import * as posenet from "@tensorflow-models/posenet";
import Layout from "../../components/Layout/Layout";
import {
  drawKeyPoints,
  drawSkeleton,
  processPose,
  drawBoundingBox
} from "../../utils/poseUtils";
import moment from "moment";

import styles from "./CapturePosePage.module.css";

class NewRecordingPage extends Component {
  constructor(props) {
    super(props);
    this.videoRef = React.createRef();
    this.canvasRef = React.createRef();
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
      recordingState: "stopped",
      videoState: "recording",
      width: 640,
      height: 480,
      poses: [],
      captureDelay: 0,
      captureInterval: null
    };
  }

  async componentDidMount() {
    await this.loadVideo();
  }

  componentWillUnmount() {
    this.videoRef.current.pause();
    const tracks = this.currentStream.getTracks();
    tracks.forEach(track => track.stop());
    this.videoRef.current = null;
    this.canvasRef.current = null;
  }

  handleStopRecord = () => {
    clearInterval(this.state.captureInterval);
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
        const poseData = processPose(pose);
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
    let newState;
    if (this.state.recordingState === "stopped" && id === "record") {
      newState = "recording";
      this.makeScreenshots();
    } else if (this.state.recordingState === "recording" && id === "stop") {
      newState = "stopped";
      this.handleStopRecord();
    }

    this.setState({
      recordingState: newState,
      videoState: 'recording'
    });
  };

  toggleShowDebug = () => {
    this.setState(prevState => ({
      poseNet: { ...prevState.poseNet, showDebug: !prevState.poseNet.showDebug }
    }));
  };

  handleClickedPose = (timeStamp, img) => {
    this.setState({
      videoState: "tagPose"
    });
    const correctPose = this.state.poses.filter(
      pose => pose.timeStamp === timeStamp
    );
    this.canvasRef.current.style.display = "block";
    this.videoRef.current.style.display = "none";
    const ctx = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, this.state.width, this.state.height);
    ctx.drawImage(img, 0, 0);
  };

  handleRecordPoses = () => {
    this.setState({
      videoState: "recording"
    });
    this.paintToCanvas();
  };

  makeScreenshots = () => {
    const captureInterval = setInterval(() => {
      this.canvasRef.current.width = this.state.width;
      this.canvasRef.current.height = this.state.height;
      const ctx = this.canvasRef.current.getContext("2d");

      ctx.drawImage(
        this.videoRef.current,
        0,
        0,
        this.state.width,
        this.state.height
      );
      const dataURI = this.canvasRef.current.toDataURL("image/png");
      this.setState(prevState => {
        const newPoses = prevState.poses.slice();
        newPoses.push({
          src: dataURI,
          timeStamp: new moment().valueOf(),
          saved: false
        });
        return {
          ...prevState,
          poses: newPoses,
          captureInterval
        };
      });
    }, this.state.captureDelay * 1000);
  };

  handleTagPose = timeStamp => {
    // fetch upload video
    // if successful change to check mark
    // else stay unchecked

    this.setState(prevState => {
      const oldPoses = prevState.poses.slice();
      oldPoses.find(pose => pose.timeStamp === timeStamp).saved = true;
      return {
        poses: oldPoses
      };
    });
  };

  handleDelayChange = e => {
    this.setState({
      captureDelay: e.target.value
    });
  };

  render() {
    const displayRecordControls = () => {
      if (!this.state.recordingState) {
        return;
      }

      if (this.state.recordingState === "stopped") {
        return (
          <Col className={styles.videoButtonContainer}>
            <Button
              className={styles.videoControl}
              onClick={() => this.setRecordingState({ id: "record" })}
            >
              Record
            </Button>
          </Col>
        );
      } else {
        return (
          <Col className={styles.videoButtonContainer}>
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

    const displayPoses = () => {
      return this.state.poses.map(pose => {
        return (
          <div className={styles.poseContainer} key={pose.timeStamp}>
            <img
              className={styles.pose}
              src={pose.src}
              height="75px"
              alt="Recording Video"
              onClick={event =>
                this.handleClickedPose(pose.timeStamp, event.target)
              }
            />
            <div className={styles.poseStatus}>
              {pose.saved ? "\u{2705}" : "\u{274C}"}
            </div>
          </div>
        );
      });
    };

    const displayPoseTaggingTools = () => {
      return (
        <Col xs={4} className={styles.poseTagContainer}>
          <div>
            <div className={styles.poseTagHeader}>Tag Punch Type</div>
          </div>
          <div className={styles.poseTagRow}>
            <Button>Jab</Button>
            <Button>Power Rear</Button>
          </div>
          <div className={styles.poseTagCategory}>Hook</div>
          <div className={styles.poseTagRow}>
            <Button>Left Hook</Button>
            <Button>Right Hook</Button>
          </div>
          <div className={styles.poseTagCategory}>Uppercut</div>
          <div className={styles.poseTagRow}>
            <Button>Left Uppercut</Button>
            <Button>Right Uppercut</Button>
          </div>
          <div className={styles.poseTagCategory}>Body Hook</div>
          <div className={styles.poseTagRow}>
            <Button>Left Body Hook</Button>
            <Button>Right Body Hook</Button>
          </div>
        </Col>
      );
    };

    return (
      <Layout>
        <Container className={styles.capturePoseContainer}>
          <Row>
            <Col className={styles.debugContainer}>
              <Button onClick={this.toggleShowDebug}>Show Debug Lines</Button>
              <Label className={styles.label}>
                Screenshot timer
                <Input
                  type="number"
                  min="0"
                  value={this.state.captureDelay}
                  onChange={this.handleDelayChange}
                />
                secs
              </Label>
            </Col>
          </Row>
          <Row>
            <Col>
              <video
                ref={this.videoRef}
                srcobject={this.currentStream}
                className={`${styles.video} ${
                  this.state.recordingState === "recording"
                    ? styles.videoRecording
                    : styles.notRecording
                }`}
              />
              <canvas className={styles.canvas} ref={this.canvasRef} />
            </Col>
            {this.state.videoState === "tagPose"
              ? displayPoseTaggingTools()
              : ""}
          </Row>
          <Row>{displayRecordControls()}</Row>
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
