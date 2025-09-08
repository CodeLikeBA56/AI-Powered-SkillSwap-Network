import axiosInstance from "../api/axios";

const updateSessionShareWithCount = (prevPosts, sessionId, user) => {
  const updatedPosts = prevPosts.map(post => {
    if (post.id === sessionId) {
        const currentSharedBy = Array.isArray(post.sharedBy) ? post.sharedBy : [];
        const uniqueSharedBy = [...new Set([...currentSharedBy, user])];
        return { ...post, sharedBy: uniqueSharedBy };
    }

    return post;
  });

  return updatedPosts;
};

const toggleSessionBookmark = (prevUserInfo, sessionId) => {
  const currentBookmark = Array.isArray(prevUserInfo.bookmarkedSessions) ? prevUserInfo.bookmarkedSessions : [];

  let updatedBookmark;
  if (currentBookmark.includes(sessionId))
    updatedBookmark = currentBookmark.filter(post => post !== sessionId);
  else
    updatedBookmark = [...currentBookmark, sessionId];

  return { ...prevUserInfo, bookmarkedSessions: updatedBookmark };
}

const getSessionStartMessage = (startTime, actualStartDate) => {
  const currentDate = new Date();
  const sessionStartDate = new Date(startTime);
  const sessionDate = sessionStartDate.toLocaleDateString();
  const sessionTime = sessionStartDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  let message = '';

  if (actualStartDate === null && currentDate > sessionStartDate) { // If the session should have started
    message = `The session was supposed to start on ${sessionDate} at ${sessionTime}, but has not yet been started by the host.`;
  }
  else if (sessionStartDate.toDateString() === currentDate.toDateString()) { // If the session is today
    message = `The session will start today at ${sessionTime}.`;
  } 
  else if (sessionStartDate.toDateString() === new Date(currentDate.setDate(currentDate.getDate() + 1)).toDateString()) { // If the session is tomorrow
    message = `The session will start tomorrow at ${sessionTime}.`;
  } 
  else { // For a session on a different date
    message = `The session will start on ${sessionDate} at ${sessionTime}.`;
  }

  return message;
};

export { updateSessionShareWithCount, toggleSessionBookmark, getSessionStartMessage };