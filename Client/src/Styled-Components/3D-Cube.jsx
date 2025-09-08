import './3D-Cube.css';
import React from 'react';

const ThreeDCube = () => {
  return (
    <div className='cube-container'>
        <div className='cube'>
            <div className='face front'>Learn</div>
            <div className='face back'>Code</div>
            <div className='face left'>Think</div>
            <div className='face right'>Build</div>
            <div className='face top'>Grow</div>
            <div className='face bottom'>Create</div>
        </div>
    </div>
  );
};

export default ThreeDCube;