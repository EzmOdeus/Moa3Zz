const generateVideoId = () => {
  return `v_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const formatVideoResponse = (video) => {
  return {
    id: video.id,
    title: video.title,
    url: video.url,
    source: video.source,
    views: video.views,
    likes: video.likes,
    createdAt: video.createdAt,
    formattedDate: video.formattedDate,
  };
};

const validateUrl = (url) => {
  const urlPattern =
    /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
  return urlPattern.test(url);
};

module.exports = {
  generateVideoId,
  formatVideoResponse,
  validateUrl,
};
