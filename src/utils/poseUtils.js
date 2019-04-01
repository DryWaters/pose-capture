// https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/demo_util.js
// https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
import * as posenet from "@tensorflow-models/posenet";
// import similarity from "compute-cosine-similarity";  Not used if using more accurate detection with score
// import VPTreeFactory from "vptree";

const pointRadius = 3;
const confidenceLevel = 0.13;
// let vptree;

function toTuple({ x, y }) {
  return [x, y];
}

export const processPose = pose => {
  return normalizePose(pose);
};

const normalizePose = pose => {
  const boundingBox = posenet.getBoundingBox(pose.keypoints);
  const normalizedArray = new Array(34);

  for (let index in pose.keypoints) {
    normalizedArray[index * 2] = pose.keypoints[index].position.x / boundingBox.maxX;
    normalizedArray[index * 2  + 1] = pose.keypoints[index].position.y / boundingBox.maxY;
  }

  return normalizedArray;
};

export function drawKeyPoints(
  keypoints,
  minConfidence,
  skeletonColor,
  canvasContext,
  scale = 1
) {
  keypoints.forEach(keypoint => {
    if (keypoint.score >= minConfidence) {
      const { x, y } = keypoint.position;
      canvasContext.beginPath();
      canvasContext.arc(x * scale, y * scale, pointRadius, 0, 2 * Math.PI);

      if (keypoint.part === "rightWrist") {
        canvasContext.fillStyle = 'blue';
      } else {
        canvasContext.fillStyle = skeletonColor;
      }
      canvasContext.fill();
    }
  });
}

function drawSegment(
  [firstX, firstY],
  [nextX, nextY],
  color,
  lineWidth,
  scale,
  canvasContext
) {
  canvasContext.beginPath();
  canvasContext.moveTo(firstX * scale, firstY * scale);
  canvasContext.lineTo(nextX * scale, nextY * scale);
  canvasContext.lineWidth = lineWidth;
  canvasContext.strokeStyle = color;
  canvasContext.stroke();
}

export function drawBoundingBox(keypoints, ctx, color) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
    boundingBox.minX,
    boundingBox.minY,
    boundingBox.maxX - boundingBox.minX,
    boundingBox.maxY - boundingBox.minY
  );

  ctx.strokeStyle = color;
  ctx.stroke();
}

export function drawSkeleton(
  keypoints,
  minConfidence,
  color,
  lineWidth,
  canvasContext,
  scale = 1
) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  adjacentKeyPoints.forEach(keypoints => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      color,
      lineWidth,
      scale,
      canvasContext
    );
  });
}
