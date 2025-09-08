import './ShowAchievementByCategory.css';
import React, { useState } from 'react';

const ShowAchievementByCategory = ({ achievements, userProgress, getProgress }) => {
    const progress = getProgress(userProgress, achievements[0].subCategory)
    return (
        <div className='achievements-by-category-container'>
            {
                achievements?.map(achievement => {
                    return (
                        <div key={achievement?._id} className='achievement-card'>
                            <header>{achievement?.title}</header>
                            <div className='achievement-detail'>
                                <p>{achievement?.description}</p>
                                { progress < achievement?.target && <span>{`${progress}/${achievement?.target}`}</span>}
                                { progress >= achievement?.target && <span className='completed-tag'>{`Completed`}</span>}
                            </div>
                            <div className='achievement-reward'>
                                <span>{`Achievement points: ${achievement?.points}`}</span>
                                <span>{`Coins: ${achievement?.reward}`}</span>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    );
};

export default ShowAchievementByCategory;