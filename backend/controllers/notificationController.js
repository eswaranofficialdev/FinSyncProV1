const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const ApiResponse = require('../utils/apiResponse');

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt')
    .limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  ApiResponse.success(res, 200, 'Notifications fetched', notifications, { unreadCount });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) return ApiResponse.error(res, 404, 'Notification not found');
  ApiResponse.success(res, 200, 'Notification marked as read', notif);
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  ApiResponse.success(res, 200, 'All notifications marked as read');
});
