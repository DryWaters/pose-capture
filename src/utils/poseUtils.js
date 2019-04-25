// https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/demo_util.js
// https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
import * as posenet from "@tensorflow-models/posenet";
const pointRadius = 3;

function toTuple({ x, y }) {
  return [x, y];
}

export const processPose = pose => {
  return normalizePose(pose);
};

const normalizePose = pose => {
  const boundingBox = posenet.getBoundingBox(pose.keypoints);
  let normalizedArray = new Array(34);

  // move all points to top left corner
  for (let index in pose.keypoints) {
    normalizedArray[index * 2] = pose.keypoints[index].position.x - boundingBox.minX;
    normalizedArray[index * 2 + 1] = pose.keypoints[index].position.y - boundingBox.minY;
  }

  // normalize between 0 and 1
  const width = boundingBox.maxX - boundingBox.minX;
  const height = boundingBox.maxY - boundingBox.minY;

  normalizedArray = normalizedArray.map((point, index) => {
    if (index % 2 === 0) {
      return point / width
    } else {
      return point / height;
    }
  })

  // for (let index in pose.keypoints) {
  //   normalizedArray[index * 2] = 
  //     pose.keypoints[index].position.x / boundingBox.maxX;
  //   normalizedArray[index * 2 + 1] =
  //     pose.keypoints[index].position.y / boundingBox.maxY;
  // }

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
      if (
        keypoint.part === "leftShoulder" ||
        keypoint.part === "rightShoulder"
      ) {
        canvasContext.fillStyle = "#00FF00AA";
      } else if (keypoint.part.includes("right")) {
        canvasContext.fillStyle = "#0000FFAA";
      } else if (keypoint.part.includes("left")) {
        canvasContext.fillStyle = "#E74C3CAA";
      } else {
        canvasContext.fillStyle = "#28B463AA";
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

  ctx.strokeStyle = "#F4D03F11";
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
  let skeletonColor;
  adjacentKeyPoints.forEach(keypoints => {
    if (
      (keypoints[0].part === "leftShoulder" &&
        keypoints[1].part === "rightShoulder") ||
      (keypoints[1].part === "leftShoulder" &&
        keypoints[0].part === "rightShoulder")
    ) {
      skeletonColor = "#00FF00AA";
    } else if (
      keypoints[0].part.includes("right") ||
      keypoints[1].part.includes("right")
    ) {
      skeletonColor = "#0000FFAA";
    } else if (
      keypoints[0].part.includes("left") ||
      keypoints[1].part.includes("left")
    ) {
      skeletonColor = "#E74C3CAA";
    } else {
      skeletonColor = "#28B463AA";
    }
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      skeletonColor,
      lineWidth,
      scale,
      canvasContext
    );
  });
}
