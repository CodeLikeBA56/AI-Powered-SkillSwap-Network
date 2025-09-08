const fs = require('fs');
const path = require('path');

// Distance function (Euclidean)
const calculateDistance = (a, b) => {
  return Math.sqrt(a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0));
};

// Initialize M random centroids
const initializeCentroids = (data, M) => {
  const centroids = [];
  const usedIndices = new Set();

  while (centroids.length < M) {
    const idx = Math.floor(Math.random() * data.length);
    if (!usedIndices.has(idx)) {
      centroids.push([...data[idx]]);
      usedIndices.add(idx);
    }
  }

  return centroids;
};

// Assign each user to the nearest centroid
const assignClusters = (data, centroids) => {
  return data.map(vector => {
    let minDist = Infinity;
    let clusterIndex = -1;

    centroids.forEach((centroid, idx) => {
      const dist = calculateDistance(vector, centroid);
      if (dist < minDist) {
        minDist = dist;
        clusterIndex = idx;
      }
    });

    return clusterIndex;
  });
};

// Recalculate centroids
const updateCentroids = (data, assignments, M) => {
  const newCentroids = Array.from({ length: M }, () => Array(data[0].length).fill(0));
  const counts = Array(M).fill(0);

  data.forEach((vector, idx) => {
    const cluster = assignments[idx];
    counts[cluster]++;
    vector.forEach((val, i) => {
      newCentroids[cluster][i] += val;
    });
  });

  newCentroids.forEach((centroid, i) => {
    if (counts[i] > 0) {
      newCentroids[i] = centroid.map(val => val / counts[i]);
    }
  });

  return newCentroids;
};

// Main KMeans function
const kMeans = (data, M = 3, iterations = 1000) => {
  let centroids = initializeCentroids(data, M);

  for (let i = 0; i < iterations; i++) {
    const assignments = assignClusters(data, centroids);
    centroids = updateCentroids(data, assignments, M);
  }

  return centroids;
};

// Save centroids to file
const saveCentroidsToFile = (centroids) => {
  const filePath = path.join(__dirname, '../Data/KMeans.json');
  fs.writeFileSync(filePath, JSON.stringify(centroids, null, 2));
};

// Load centroids from file
const loadCentroidsFromFile = () => {
  const filePath = path.join(__dirname, '../Data/KMeans.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

module.exports = { kMeans, assignClusters, saveCentroidsToFile, loadCentroidsFromFile };