const { kMeans, assignClusters, saveCentroidsToFile } = require("../Utils/KMeans.js");
const skillsDataSet = require("../Data/SkillsData.js");
const UserCollection = require("../Models/Users");

const retrainModel = async (req, res) => {
    try {
      const users = await UserCollection.find({}, { _id: 1, offeredSkills: 1 }).lean();
      if (!users || users.length === 0)
        return res.status(404).json({ type: "error", message: "No users found" });
  
      const skillsList = skillsDataSet;
      const binarySkillVectors = users.map(user =>
        skillsList.map(skill => user.offeredSkills.includes(skill) ? 1 : 0)
      );
  
      const M = 3; // Number of clusters
      const centroids = kMeans(binarySkillVectors, M, 10000);
  
      saveCentroidsToFile(centroids);
  
      const assignments = assignClusters(binarySkillVectors, centroids);
  
      const bulkOps = users.map((user, idx) => ({
        updateOne: {
          filter: { _id: user._id }, update: { clusterId: assignments[idx] }
        }
      }));
  
      await UserCollection.bulkWrite(bulkOps);
      return res.status(200).json({ type: "success", message: "Model retrained", assignments });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ type: "error", message: "Internal server error" });
    }
  };

module.exports = { retrainModel };