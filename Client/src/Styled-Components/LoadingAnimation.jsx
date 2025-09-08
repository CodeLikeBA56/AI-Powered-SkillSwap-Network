import React from 'react';
import "./LoadingAnimation.css";

const LoadingAnimation = ({ skillsToDisplay }) => {
  return (
    <div className="parent">
        <span className="child item-1">{skillsToDisplay[0]}</span>
        <span className="child item-2">{skillsToDisplay[1]}</span>
        <span className="child item-3">{skillsToDisplay[2]}</span>
    </div>
  )
}

export default LoadingAnimation
