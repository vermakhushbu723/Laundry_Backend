import Sms from '../models/Sms.js';

// Sync single SMS
const syncSms = async (req, res) => {
  try {
    const { userId, smsData } = req.body;

    if (!userId || !smsData) {
      return res.status(400).json({
        success: false,
        message: 'userId and smsData are required'
      });
    }

    // Check if SMS already exists
    const existingSms = await Sms.findOne({
      userId,
      smsId: smsData.id
    });

    if (existingSms) {
      return res.status(200).json({
        success: true,
        message: 'SMS already synced',
        data: existingSms
      });
    }

    // Create new SMS record
    const sms = new Sms({
      userId,
      smsId: smsData.id,
      address: smsData.address,
      body: smsData.body,
      date: new Date(smsData.date),
      type: smsData.type
    });

    await sms.save();

    res.status(201).json({
      success: true,
      message: 'SMS synced successfully',
      data: sms
    });
  } catch (error) {
    console.error('Error syncing SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync SMS',
      error: error.message
    });
  }
};

// Sync batch of SMS
const syncSmsBatch = async (req, res) => {
  try {
    const { userId, smsData } = req.body;

    if (!userId || !Array.isArray(smsData)) {
      return res.status(400).json({
        success: false,
        message: 'userId and smsData array are required'
      });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each SMS
    for (const sms of smsData) {
      try {
        // Check if SMS already exists
        const existingSms = await Sms.findOne({
          userId,
          smsId: sms.id
        });

        if (existingSms) {
          skippedCount++;
          continue;
        }

        // Create new SMS record
        await Sms.create({
          userId,
          smsId: sms.id,
          address: sms.address,
          body: sms.body,
          date: new Date(sms.date),
          type: sms.type
        });

        syncedCount++;
      } catch (err) {
        errors.push({
          smsId: sms.id,
          error: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'SMS batch sync completed',
      data: {
        synced: syncedCount,
        skipped: skippedCount,
        errors: errors.length,
        errorDetails: errors
      }
    });
  } catch (error) {
    console.error('Error syncing SMS batch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync SMS batch',
      error: error.message
    });
  }
};

// Get all SMS for a user
const getUserSms = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 100, type, search } = req.query;

    const query = { userId };

    // Filter by type if provided
    if (type && ['inbox', 'sent'].includes(type)) {
      query.type = type;
    }

    // Search in address or body
    if (search) {
      query.$or = [
        { address: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [smsMessages, total] = await Promise.all([
      Sms.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Sms.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        smsMessages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting user SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user SMS',
      error: error.message
    });
  }
};

// Get all SMS for all users (Admin only)
const getAllSms = async (req, res) => {
  try {
    const { page = 1, limit = 100, userId, type, search } = req.query;

    const query = {};

    // Filter by userId if provided
    if (userId) {
      query.userId = userId;
    }

    // Filter by type if provided
    if (type && ['inbox', 'sent'].includes(type)) {
      query.type = type;
    }

    // Search in address or body
    if (search) {
      query.$or = [
        { address: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [smsMessages, total] = await Promise.all([
      Sms.find(query)
        .populate('userId', 'name phoneNumber')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Sms.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        smsMessages,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting all SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get all SMS',
      error: error.message
    });
  }
};

// Get SMS statistics
const getSmsStatistics = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId ? { userId } : {};

    const [total, inbox, sent, users] = await Promise.all([
      Sms.countDocuments(query),
      Sms.countDocuments({ ...query, type: 'inbox' }),
      Sms.countDocuments({ ...query, type: 'sent' }),
      userId ? null : Sms.distinct('userId')
    ]);

    const stats = {
      total,
      inbox,
      sent,
      users: users ? users.length : null
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting SMS statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SMS statistics',
      error: error.message
    });
  }
};

// Delete SMS for a user (optional - for testing)
const deleteUserSms = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Sms.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} SMS messages`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error deleting user SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user SMS',
      error: error.message
    });
  }
};

export {
  syncSms,
  syncSmsBatch,
  getUserSms,
  getAllSms,
  getSmsStatistics,
  deleteUserSms
};
