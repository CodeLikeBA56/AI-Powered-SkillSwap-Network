const truncateTitle = (title, maxLength) => {
    if (title.length > maxLength) {
        return title.slice(0, maxLength) + '...';
    }
    return title;
};

export default truncateTitle;