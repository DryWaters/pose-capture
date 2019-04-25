const fs = require("fs");

const allPoses = [];

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + "/" + file).isDirectory();
  });
}

function getPosesInDirectory(path) {
  fs.readdirSync(`poses/${path}`).forEach(file => {
    if (file.endsWith(".json")) {
      const currentPoseData = JSON.parse(
        fs.readFileSync(`poses/${path}/${file}`, "utf8")
      );
      currentPoseData.push(`${path}`);
      const timestamp = file.substring(0, file.lastIndexOf(".json"));
      currentPoseData.push(`${timestamp}`);
      allPoses.push(currentPoseData);
    }
  });
}

function exportPoses(path) {
  const directories = getDirectories(path);
  directories.forEach(path => getPosesInDirectory(path));
  fs.writeFileSync("poseData.json", JSON.stringify(allPoses));
}

exportPoses("poses");
