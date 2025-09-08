import React from 'react';
import './MediaPreview.css';

const MediaPreview = React.memo(({ mediaToPreview = [], setMediaToPreview }) => {
    console.log("Rerendered due to state change");
    const handleRemove = (indexToRemove) => {
        setMediaToPreview(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div className='attached-media-preview'>
            <h6>Attached Media</h6>

            <div className='media-grid'>
                {mediaToPreview.map((file, index) => {
                    const fileType = file.type;
                    const extension = file.name.split('.').pop().toLowerCase();

                    return (
                        <div key={index} className="media-wrapper">
                            {fileType.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} alt="preview" className="media-thumbnail" />
                            ) : fileType.startsWith('video/') ? (
                                <video src={URL.createObjectURL(file)} className="media-thumbnail" muted controls />
                            ) : (
                                <div className="media-square" style={{ backgroundColor: "var(--secondary-color)" }}>
                                    {extension.toUpperCase()}
                                </div>
                            )}

                            <button className="remove-btn" onClick={() => handleRemove(index)}>
                                <span className='material-symbols-outlined'>close</span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default MediaPreview;