const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: "Reel جديد",
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["external", "upload"],
      default: "upload",
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for formatted date
videoSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("ar-EG");
});

// Index for better query performance
videoSchema.index({ createdAt: -1 });
videoSchema.index({ views: -1 });
videoSchema.index({ likes: -1 });

// Pre-save middleware
videoSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = `v_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
  next();
});

// Static methods
videoSchema.statics.getStats = async function () {
  const totalVideos = await this.countDocuments();
  const result = await this.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: "$likes" },
        avgViews: { $avg: "$views" },
        avgLikes: { $avg: "$likes" },
      },
    },
  ]);

  return {
    totalVideos,
    totalViews: result[0]?.totalViews || 0,
    totalLikes: result[0]?.totalLikes || 0,
    avgViews: Math.round(result[0]?.avgViews || 0),
    avgLikes: Math.round(result[0]?.avgLikes || 0),
  };
};

// Instance methods
videoSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
  return this;
};

videoSchema.methods.incrementLikes = async function () {
  this.likes += 1;
  await this.save();
  return this;
};

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
