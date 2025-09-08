import axiosInstance from "../api/axios";

const updatePostShareWithCount = (prevPosts, postId, user) => {
  const updatedPosts = prevPosts.map(post => {
    if (post.id === postId) {
        const currentSharedBy = Array.isArray(post.sharedBy) ? post.sharedBy : [];
        const uniqueSharedBy = [...new Set([...currentSharedBy, user])];
        return { ...post, sharedBy: uniqueSharedBy };
    }

    return post;
  });

  return updatedPosts;
};

const togglePostBookmark = (prevUserInfo, postId) => {
  const currentBookmark = Array.isArray(prevUserInfo.bookmarkedPosts) ? prevUserInfo.bookmarkedPosts : [];

  let updatedBookmark;
  if (currentBookmark.includes(postId))
    updatedBookmark = currentBookmark.filter(post => post !== postId);
  else
    updatedBookmark = [...currentBookmark, postId];

  return { ...prevUserInfo, bookmarkedPosts: updatedBookmark };
}

export { updatePostShareWithCount, togglePostBookmark };