import "./Leaderboard.css";
import React, { useState, useEffect } from "react";
import NoProfile from "../../assets/No-Profile.webp";
import { useSettingContext } from "../../context/SettingContext";
import { useUserProfile } from "../../context/UserProfileProvider";
import { useAchievements } from "../../context/AchievementsProvider";

const Card = ({ player, index }) => {
  const { userInfo, redirectToUserProfile } = useUserProfile();

  return (
    <div className={`player-card`}>
      <img 
        src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${player?.profilePicture}`}
        className="top-users-avatar"
        onError={(e) => (e.target.src = NoProfile)}
        onClick={() => redirectToUserProfile(player?._id, "/dashboard/leaderboard", "Leaderboard")}
      />
      <div className="player-info">
        <h2 className="player-name" style={{textDecoration: player._id === userInfo?._id ? 'underline' : ''}}>{player.username}</h2>
        <p className="player-rank">Rank: {index + 1}</p>
      </div>
      <span className="trophy">🏆</span>
    </div>
  );
}

const Leaderboard = () => {
  const { changeActiveLink } = useSettingContext();
  const { userInfo, redirectToUserProfile } = useUserProfile();
  const { leaderboard, fetchLeaderboardStats } = useAchievements();

  useEffect(() => {
    changeActiveLink('Leaderboard');
  }, []);

  return (
    <div className="leaderboard-container">
      <main className="leaderboard-content">
        <h1 className="title">Leaderboard</h1>
        <p className="subtitle">Top Students</p>

        <div className="grid">
          {leaderboard.slice(0, 3).map((player, index) => (
            <Card key={index} player={player} index={index} />
          ))}
        </div>

        <div className="view-buttons">
          <button className={`view-button`} onClick={fetchLeaderboardStats}>Refresh Leaderboard</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Coins earned</th>
              <th>Points</th>
              <th>No. of Achievements</th>
              <th>Time Spent</th>
            </tr>
          </thead>
          <tbody>
           
            {leaderboard.map((player, index) => (
              <tr key={index} style={{ background: userInfo?._id === player._id ? 'var(--shadow-color)' : '' }}>
                <td>{index + 1}</td>
                <td className="user-info">
                  <img 
                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${player?.profilePicture}` || NoProfile}
                    className="avatar-img"
                    onError={(e) => (e.target.src = NoProfile)}
                    onClick={() => redirectToUserProfile(player?._id, "/dashboard/leaderboard", "Leaderboard")}
                  />
                  <span className="player-name">{player.username}</span>
                </td>
                <td>{player.coins || 0}</td>
                <td>{player.totalAchievementPoints || 0}</td>
                <td>{player.completedCount}</td>
                <td>{`${parseInt(player.timeSpentInSeconds / 60)} mins`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Leaderboard;
