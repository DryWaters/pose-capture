// https://github.com/tensorflow/tfjs-models/blob/master/posenet/demos/demo_util.js
// https://medium.com/tensorflow/move-mirror-an-ai-experiment-with-pose-estimation-in-the-browser-using-tensorflow-js-2f7b769f9b23
import * as posenet from "@tensorflow-models/posenet";
// import similarity from "compute-cosine-similarity";  Not used if using more accurate detection with score
import VPTreeFactory from "vptree";

const pointRadius = 3;
const confidenceLevel = 0.13;
let vptree;

const poseData = [
  [
    0.7511041184552876,
    0.22171357411739392,
    0.7561281345386117,
    0.18736150711565103,
    0.7318283049481886,
    0.19741954924465124,
    0.7408462095236801,
    0.20267836548355625,
    0.6619536630291802,
    0.21006501712903475,
    0.6742728384999104,
    0.2947834135880367,
    0.643560157202066,
    0.28669222171629816,
    0.794565599596234,
    0.29172160726099805,
    0.8060906981549777,
    0.28999088262371725,
    1,
    0.26085345302402696,
    0.9907114563424775,
    0.26270831194410055,
    0.679772232737636,
    0.6000902913370807,
    0.6152217371485272,
    0.5947170474985992,
    0.6698454420252251,
    0.803471662393424,
    0.6057046673064914,
    0.810849432231928,
    0.6743869600022137,
    0.9596757522756226,
    0.5402059235734651,
    1,
    'leftPunch'
  ],
  [
    0.689359754804897,
    0.20155548974804813,
    0.6988135972361454,
    0.18483253461711746,
    0.6558486933600791,
    0.18490401386105834,
    0.7249064330249875,
    0.18469564475929623,
    0.6069284641305341,
    0.2052893872335228,
    0.7707806082474745,
    0.2949893856587517,
    0.5534513173128672,
    0.3169787017971211,
    0.874383889146913,
    0.3061108992211797,
    0.4871992873006072,
    0.4520766045477085,
    1,
    0.2609495946500801,
    0.5767280060548258,
    0.4464982276143408,
    0.7278021804325744,
    0.6059643110779769,
    0.6034334803340811,
    0.5993753151942749,
    0.74002684644002,
    0.8191110378778538,
    0.5803852365048554,
    0.8205946258824,
    0.7084121823641014,
    0.9687124479509347,
    0.5588649134768446,
    1,
    'rightPunch'
  ],
  [
    0.7831916252494893,
    0.37067633177943404,
    0.7705533314923848,
    0.3519196279027421,
    0.7655466509803216,
    0.3517560319728591,
    0.7510751488113815,
    0.3629630644564969,
    0.7099391072199299,
    0.3627455979217851,
    0.7074786281039579,
    0.4451737628366651,
    0.6966750408179536,
    0.4594983272784121,
    0.8951655630131164,
    0.4545366162132327,
    0.7225446933497653,
    0.5164379842645423,
    1,
    0.4502210903530213,
    0.9945510591029321,
    0.44792958681433276,
    0.7888265751718648,
    0.6460629385362978,
    0.7267220316080518,
    0.6512153492964027,
    0.7252868076074112,
    0.8032413407588664,
    0.7243363722297763,
    0.820180594932135,
    0.693233624173217,
    1,
    0.6594577974234379,
    0.9984747768019924,
    'leftPunch'
  ],
  [
    0.714631694796499,
    0.35324413869302246,
    0.7055721851516489,
    0.33884191011762665,
    0.6904471423649056,
    0.34117365288293056,
    0.6953712899288161,
    0.3436604916074617,
    0.6265588860011838,
    0.3592541998294612,
    0.7196521683242253,
    0.43177602452340813,
    0.614434108902061,
    0.4586059936614633,
    0.8514855703381601,
    0.43624677124480865,
    0.6385800335672045,
    0.5705138475250215,
    1,
    0.42702130607560795,
    0.6963567037271412,
    0.47394806963014924,
    0.7262306554823593,
    0.6721534736451097,
    0.6687403663892338,
    0.6737282428035771,
    0.7107306149881252,
    0.8413668738173099,
    0.6485097229171883,
    0.8383916422933849,
    0.708706227883372,
    0.9988707145006044,
    0.6247409464549367,
    1,
    'rightPunch'
  ]
];

function toTuple({ x, y }) {
  return [x, y];
}

export const processPose = pose => {
  const normalizedPose = normalizePose(pose);
  return findMostSimliarMatch(normalizedPose);
};

const normalizePose = pose => {
  const boundingBox = posenet.getBoundingBox(pose.keypoints);
  const normalizedArray = new Array(34);
  const confidences = new Array(17);
  let sumConfidences = 0;

  for (let index in pose.keypoints) {
    sumConfidences += pose.keypoints[index].score;
    confidences[index] = pose.keypoints[index].score;
    normalizedArray[index * 2] = pose.keypoints[index].position.x / boundingBox.maxX;
    normalizedArray[index * 2  + 1] = pose.keypoints[index].position.y / boundingBox.maxY;
  }

  return [...normalizedArray, ...confidences, sumConfidences];
};

const weightedDistanceMatching = (pose, punchPose) => {
  const vector1PoseXY = pose.slice(0, 34);
  const vector1Confidences = pose.slice(34, 51);
  const vector1ConfidenceSum = pose.slice(51, 52);
  const vector2PoseXY = punchPose.slice(0, 34);
  const summation1 = 1 / vector1ConfidenceSum;
  let summation2 = 0;
  for (let i = 0; i < vector1PoseXY.length; i++) {
    let tempConf = Math.floor(i / 2);
    let tempSum =
      vector1Confidences[tempConf] *
      Math.abs(vector1PoseXY[i] - vector2PoseXY[i]);
    summation2 = summation2 + tempSum;
  }

  return summation1 * summation2;
};

// No longer used since using more accurate detection using keypoint weights
// const cosineDistanceMatching = (pose, punchPose) => {
//   let cosineSimliary = similarity(pose, punchPose);
//   let distance = 2 * (1 - cosineSimliary);
//   return Math.sqrt(distance);
// };

const buildVPTree = () => {
  vptree = VPTreeFactory.build(poseData, weightedDistanceMatching);
};

const findMostSimliarMatch = pose => {
  let nearestPose = vptree.search(pose);
  if (nearestPose[0].d < confidenceLevel) {
    return poseData[nearestPose[0].i][34];
  } else {
    return "no_punch";
  }
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

buildVPTree();
