const pose0 = document.querySelector("#pose0");
const pose1 = document.querySelector("#pose1");
const canvas = document.querySelector("#canvas");
canvas.width = 800;
canvas.height = 400;
const ctx = canvas.getContext("2d");

pose0.addEventListener("change", e => drawPose());
pose1.addEventListener("change", e => drawPose());

function drawPose() {
  ctx.clearRect(0, 0, 800, 400);
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.rect(0, 0, 400, 400);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(400, 0, 400, 400);
  ctx.stroke();

  if (pose0.value) {
    const pose = JSON.parse(pose0.value);
    drawKeypoints(pose, 0);
    drawSkeleton(pose, 0);
  }

  if (pose1.value) {
    const pose = JSON.parse(pose1.value);
    drawKeypoints(pose, 1);
    drawSkeleton(pose, 1);
  }
}

function drawKeypoints(pose, offset) {
  const keypoints = new Map();
  for (let i = 0; i < pose.length; i = i + 2) {
    keypoints.set(i / 2, createTuples(pose[i], pose[i + 1]));
  }

  for (const [key, value] of keypoints.entries()) {
    ctx.fillStyle = getPointColor(key);
    ctx.beginPath();
    ctx.arc(value.x * 400 + offset * 400, value.y * 400, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
  // keypoints.forEach(point => {

  // })
  // for (let i = 0; i < pose.length; i = i + 2) {
  //   let point = createTuples(i, i + 1);

  // }
}

function drawSkeleton(pose, offset) {
  const keypoints = new Map();
  for (let i = 0; i < pose.length; i = i + 2) {
    keypoints.set(i / 2, createTuples(pose[i], pose[i + 1]));
  }

  // draw right arm
  ctx.beginPath();
  ctx.strokeStyle = getPointColor(2);
  ctx.moveTo(keypoints.get(6).x * 400 + offset * 400, keypoints.get(6).y * 400);
  ctx.lineTo(keypoints.get(8).x * 400 + offset * 400, keypoints.get(8).y * 400);
  ctx.lineTo(
    keypoints.get(10).x * 400 + offset * 400,
    keypoints.get(10).y * 400
  );
  ctx.stroke();

  // draw right side of body
  ctx.beginPath();
  ctx.moveTo(keypoints.get(6).x * 400 + offset * 400, keypoints.get(6).y * 400);
  ctx.lineTo(
    keypoints.get(12).x * 400 + offset * 400,
    keypoints.get(12).y * 400
  );
  ctx.lineTo(
    keypoints.get(14).x * 400 + offset * 400,
    keypoints.get(14).y * 400
  );
  ctx.lineTo(
    keypoints.get(16).x * 400 + offset * 400,
    keypoints.get(16).y * 400
  );
  ctx.stroke();

  // draw left arm
  ctx.beginPath();
  ctx.strokeStyle = getPointColor(1);
  ctx.moveTo(keypoints.get(5).x * 400 + offset * 400, keypoints.get(5).y * 400);
  ctx.lineTo(keypoints.get(7).x * 400 + offset * 400, keypoints.get(7).y * 400);
  ctx.lineTo(keypoints.get(9).x * 400 + offset * 400, keypoints.get(9).y * 400);
  ctx.stroke();

  // draw left side of body
  ctx.beginPath();
  ctx.moveTo(keypoints.get(5).x * 400 + offset * 400, keypoints.get(5).y * 400);
  ctx.lineTo(
    keypoints.get(11).x * 400 + offset * 400,
    keypoints.get(11).y * 400
  );
  ctx.lineTo(
    keypoints.get(13).x * 400 + offset * 400,
    keypoints.get(13).y * 400
  );
  ctx.lineTo(
    keypoints.get(15).x * 400 + offset * 400,
    keypoints.get(15).y * 400
  );
  ctx.stroke();

  // join shoulders
  ctx.beginPath();
  ctx.strokeStyle = getPointColor(0);
  ctx.moveTo(keypoints.get(5).x * 400 + offset * 400, keypoints.get(5).y * 400);
  ctx.lineTo(keypoints.get(6).x * 400 + offset * 400, keypoints.get(6).y * 400);
  ctx.stroke();

  // join waist
  ctx.beginPath();
  ctx.moveTo(
    keypoints.get(11).x * 400 + offset * 400,
    keypoints.get(11).y * 400
  );
  ctx.lineTo(
    keypoints.get(12).x * 400 + offset * 400,
    keypoints.get(12).y * 400
  );
  ctx.stroke();
}

function createTuples(x, y) {
  return { x, y };
}

function getPointColor(id) {
  switch (id) {
    case 0: {
      // nose
      return "green";
    }
    case 15: // left ankle
    case 13: // left knee
    case 11: // left hip
    case 9: // left wrist
    case 7: // left elbow
    case 5: // left shoulder
    case 3: // left ear
    case 1: {
      // left eye
      return "red";
    }
    case 16: // right ankle
    case 14: // right knee
    case 12: // right hip
    case 10: // right wrist
    case 8: // right elbow
    case 6: // right shoulder
    case 4: // right ear
    case 2: {
      // right eye
      return "blue";
    }
  }
}