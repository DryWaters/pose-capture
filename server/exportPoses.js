const fs = require("fs");

const allPoses = [];

function getDirectories(path) {
  return fs.readdirSync(path).filter(function(file) {
    return fs.statSync(path + "/" + file).isDirectory();
  });
}

function getPosesInDirectory(path) {
  fs.readdirSync(`poses/${path}`).forEach(file => {
    if (file.endsWith('.json')) {
      allPoses.push(JSON.parse(fs.readFileSync(`poses/${path}/${file}`)));
    }
  });
}

function exportPoses(path) {
  const directories = getDirectories(path);
  directories.forEach(path => getPosesInDirectory(path));
  fs.writeFileSync("poseData.json", JSON.stringify(allPoses));
}

exportPoses("poses");
