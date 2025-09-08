import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './UserProfileProvider';
import axiosInstance from '../api/axios';
import { useAlertContext } from './AlertContext';

const AchievementContext = createContext();

const AchievementProvider = ({ children }) => {
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();

    const [leaderboard, setLeaderboard] = useState([]);
    const [achievements, setAchievements] = useState([]);

    const fetchAchievements = async () => {
        try {
            const response = await axiosInstance.get('api/achievements/');
            if (200 === response.status)
                setAchievements(response.data.achievements);
        } catch (error) {
            showAlert('error', 'Failed to fetch achievements');
        }
    }

    const fetchLeaderboardStats = async () => {
        try {
            const response = await axiosInstance.get('api/achievements/get-leaderboard-stats');
            if (200 === response.status)
                setLeaderboard(response.data.leaderboard);
        } catch (error) {
            showAlert('error', 'Failed to fetch achievements');
        }
    }

    useEffect(() => {
        if (userInfo && achievements.length === 0)
            fetchAchievements();

        if (userInfo && leaderboard.length === 0)
            fetchLeaderboardStats();
    }, [userInfo?._id]);

    useEffect(() => {
        if (userInfo === null) {
            setLeaderboard([]);
            setAchievements([]);
        }
    }, [userInfo]);

    return (
        <AchievementContext.Provider value={{ leaderboard, achievements, fetchLeaderboardStats }}>
            {children}
        </AchievementContext.Provider>
    );
};

export const useAchievements = () => useContext(AchievementContext);

export default AchievementProvider;