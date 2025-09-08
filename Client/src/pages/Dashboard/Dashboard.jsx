import './Dashboard.css';
import axiosInstance from '../../api/axios.js';
import React, { useEffect, useState } from 'react';
import { useSettingContext } from '../../context/SettingContext.jsx';
import CustomModal from '../../components/Custom/CustomModel.jsx';
import CreatePostForm from '../../components/Forms/CreatePostForm.jsx';
import PostSection from '../../components/Post-Section/Post-Section.jsx';
import CreateSessionForm from '../../components/Forms/CreateSessionForm.jsx';
import { useRecommendation } from '../../context/RecommendationProvider.jsx';
import FriendsSuggestion from '../../components/Friends-Suggestion/Suggestion.jsx';
import UpcomingSessions from '../../components/Session-Suggestion/Upcoming-Sessions.jsx';

const Dashboard = () => {
  const { changeActiveLink } = useSettingContext();
  const { recommendedPosts, setRecommendedPosts } = useRecommendation();

  useEffect(() => { changeActiveLink('Dashboard'); }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState("Session");

  useEffect(() => {
    const createBtn = document.querySelector(".create-btn");
    const closeBtn = document.getElementById("#close-create-btn");
    
    const toggleBtn = () => {
      createBtn.classList.toggle("open");
    }

    closeBtn?.addEventListener("click", toggleBtn);
    createBtn?.addEventListener("click", toggleBtn);

    return () => {
      createBtn?.removeEventListener("click", toggleBtn)
      closeBtn?.removeEventListener("click", toggleBtn)
    };
  }, [])

  const showPostCreationForm = () => {
    setIsModalOpen(true);
    setSelectedForm('Post');
  }
  
  const showSessionCreationForm = () => {
    setIsModalOpen(true);
    setSelectedForm('Session');
  }

  const hideModal = () => {
    setTimeout(() => {
        setIsModalOpen(false);
    }, 1000);
  };

  return (
    <div className='dashboard-container'>
      <div className='scroll-section'>
        <PostSection posts={recommendedPosts} setPosts={setRecommendedPosts} />
      </div>
      <div className='sidebar-right'>
        <FriendsSuggestion />
        <UpcomingSessions />
      </div>
      
      <div className='create-btn'>
        <span className='material-symbols-outlined' id='close-create-btn'>arrow_drop_down</span>
        <span className='material-symbols-outlined create-icon'>add</span>
        <button className='create-post-btn' type='button' onClick={showPostCreationForm}>
          <span className="material-symbols-outlined btn-icon">add_circle</span>
          <span className='btn-text'>Create Post</span>
        </button>
        <button className='create-session-btn' type='button' onClick={showSessionCreationForm}>
          <span className="material-symbols-outlined btn-icon">duo</span>
          <span className='btn-text'>Create Session</span>
        </button>
      </div>

      <CustomModal isOpen={isModalOpen} onClose={hideModal} title={"Create " +selectedForm}>
        {selectedForm === 'Post' && <CreatePostForm closeModal={hideModal} />}
        {selectedForm ==='Session' && <CreateSessionForm closeModal={hideModal} />}
      </CustomModal>      
    </div>
  );
};

export default Dashboard;