const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'videos.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ videos: [] }, null, 2), 'utf-8');
  }
}

function readData() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read data file', err);
    return { videos: [] };
  }
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let videos = [];

function nextId() {
  return `v_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}



function refreshVideos() {

  writeData({ videos:[] });
  console.log(`Refreshed videos at ${new Date().toISOString()}`);
}

function loadVideos() {
  const data = readData();
  if (Array.isArray(data.videos) && data.videos.length >= 1) {
    videos = data.videos;
  } else {
    refreshVideos();
  }
}

function getAllVideos() {
  return videos;
}

function getVideoById(id) {
  return videos.find((v) => v.id === id);
}

function addVideo({ title, url, source }) {
  const item = {
    id: nextId(),
    title: title || 'Reel جديد',
    url,
    source: source === 'external' ? 'external' : 'upload',
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
  };
  videos.unshift(item);
  writeData({ videos });
  return item;
}

function deleteVideo(id) {
  const before = videos.length;
  videos = videos.filter((v) => v.id !== id);
  const changed = before !== videos.length;
  if (changed) writeData({ videos });
  return changed;
}

function incrementView(id) {
  const v = getVideoById(id);
  if (!v) return null;
  v.views += 1;
  writeData({ videos });
  return v;
}

function incrementLike(id) {
  const v = getVideoById(id);
  if (!v) return null;
  v.likes += 1;
  writeData({ videos });
  return v;
}

const lastViewedByUser = new Map();

function getStats() {
  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
  return {
    totalVideos,
    totalViews,
    totalLikes,
    videos,
  };
}

function setLastViewed(userId, videoId) {
  if (!userId || !videoId) return;
  lastViewedByUser.set(userId, videoId);
}

function getLastViewed(userId) {
  if (!userId) return null;
  const vid = lastViewedByUser.get(userId);
  return vid ? getVideoById(vid) : null;
}

module.exports = {
  loadVideos,
  refreshVideos,
  getAllVideos,
  getVideoById,
  addVideo,
  deleteVideo,
  incrementView,
  incrementLike,
  getStats,
  setLastViewed,
  getLastViewed,
};
