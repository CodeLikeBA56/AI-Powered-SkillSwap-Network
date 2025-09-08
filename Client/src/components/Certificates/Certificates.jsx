import './Certificates.css';
import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { useAlertContext } from '../../context/AlertContext';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';


const Certificates = ({ userInfo, editingRights = false }) => {
    const { showAlert } = useAlertContext();
    const { setUserInfo } = useUserProfile();

    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const [userCertificates, setUserCertificates] = useState([]);
    const [certToDelete, setCertToDelete] = useState([]);
    const [failedCerts, setFailedCerts] = useState([]);
    const [newCertificates, setNewCertificates] = useState([]);

    useEffect(() => {
        if (userInfo?.certificates?.length) {
            setUserCertificates(userInfo?.certificates);
        }
    }, [userInfo?.certificates])

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + newCertificates.length > 10) {
            alert("You can only upload up to 10 certificates.");
            return;
        }
        setNewCertificates([...newCertificates, ...files]);
    };

    const handleAttachClick = () => {
        fileInputRef.current.click();
    };

    const handleResetChanges = () => {
        setIsEditing(false);
        setCertToDelete([]);
        setNewCertificates([]);
        setUserCertificates(userInfo?.certificates);
    };

    const handleRemoveCert = (fileId, index) => {
        setCertToDelete(prev => [...prev, fileId]);
        setUserCertificates((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleRemoveNewCert = (index) => {
        setNewCertificates((prevFiles) => prevFiles.filter((_, i) => i !== index));
    }

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (newCertificates.length === 0 && certToDelete.length === 0) {
            setCertToDelete([]);
            setCertToDelete([]);
            showAlert("info", "No new certificates to upload.");
            setIsEditing(false);
            return;
        }
        
        const formData = new FormData();
        formData.append("certificatesToDelete", JSON.stringify(certToDelete));
        newCertificates?.forEach((file) => formData.append('certificates', file));
        
        try {
            const response = await axiosInstance.patch('api/user-profile/update-user-certificates', formData);
            
            if (response.status === 200) {
                certToDelete?.forEach(fileId => axiosInstance.delete(`api/delete-media/user-media/${fileId}`));
                const { type, message, user } = response.data;
                showAlert(type, message);
                setUserInfo(user);
                setNewCertificates([]);
                setCertToDelete([]);
            }
        } catch (error) {
            console.log(error);
            showAlert("error", "Failed to upload certificates. Please try again.");
        }

        setIsEditing(false);
    };

    return (
        <div>
            <div className='certificates'>
                {userInfo?.certificates?.length > 0 || newCertificates.length > 0 ? (
                    <>
                        {
                            userCertificates?.map((cert, index) => {
                                const certUrl = `${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${cert}`;
                                const hasError = failedCerts.includes(cert);

                                return (
                                    <article key={index} className="certificate-item">
                                        {hasError ? (
                                            <iframe
                                                src={certUrl}
                                                title={`Certificate ${index + 1}`}
                                                className="certificate-preview pdf-preview"
                                                frameBorder="0"
                                            />
                                        ) : (
                                            <img
                                                src={certUrl}
                                                alt={`Certificate ${index + 1}`}
                                                className="certificate-preview"
                                                onError={() =>
                                                    setFailedCerts(prev => [...prev, cert])
                                                }
                                            />
                                        )}

                                        {isEditing && (
                                            <button
                                                className="delete-cert-btn"
                                                onClick={() => handleRemoveCert(cert, index)}
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        )}
                                    </article>
                                );
                            })
                        }
                        {
                            newCertificates.length > 0 && newCertificates.map((cert, index) => (
                                <article key={index} className="certificate-item">
                                    {cert.type === "application/pdf" ? (
                                        <iframe
                                            src={URL.createObjectURL(cert)}
                                            title={`Certificate PDF ${index + 1}`}
                                            className="certificate-preview pdf-preview"
                                        />
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(cert)}
                                            alt={`Certificate ${index + 1}`}
                                            className="certificate-preview"
                                        />
                                    )}
                                    
                                    {
                                        isEditing && (
                                            <button className='delete-cert-btn' onClick={() => handleRemoveNewCert(index)}>
                                                <span className='material-symbols-outlined'>close</span>
                                            </button>
                                        )
                                    }
                                </article>
                            ))
                        }
                    </>
                ) : (
                    <p className="no-certificates">No certificates to display.</p>
                )}
            </div>

            {editingRights && (
                <form onSubmit={handleSave} className="button-container">
                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="edit-btn">Manage Certificates</button>
                    ) : (
                        <>
                            <input 
                                type="file"
                                accept="image/*,application/pdf" 
                                onChange={handleFileChange}
                                multiple
                                ref={fileInputRef}
                                disabled={newCertificates.length >= 10}
                                hidden
                            />
                            <button type='button' className='attach-file-btn' onClick={handleAttachClick}>
                                <span className='material-symbols-outlined'>attach_file</span>
                            </button>
                            <button onClick={handleResetChanges} className="edit-btn">Discard Changes</button>
                            <button type='submit' className="save-btn">Save Changes</button>
                        </>
                    )}
                </form>
            )}
        </div>
    );
};

export default Certificates;