import Contact from '../models/Contact.js';
import User from '../models/User.js';

// Sync contacts from user's phone
export const syncContacts = async (req, res) => {
  try {
    console.log('🔹 Sync contacts request received');
    const userId = req.user.id;
    const { contacts, userPhoneNumber } = req.body;
    
    console.log('👤 User ID:', userId);
    console.log('📱 User Phone:', userPhoneNumber);
    console.log('📞 Contacts count:', contacts?.length || 0);

    if (!contacts || !Array.isArray(contacts)) {
      console.log('❌ Invalid contacts data');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid contacts data' 
      });
    }

    if (contacts.length === 0) {
      console.log('⚠️ No contacts to sync');
      return res.status(200).json({ 
        success: false, 
        message: 'No contacts to sync' 
      });
    }

    // Get user details
    const user = await User.findById(userId);
    
    // Add user's own phone number to contacts if provided
    if (userPhoneNumber && user) {
      console.log('➕ Adding user\'s own number to contacts');
      contacts.push({
        name: user.name || 'Me (Own Number)',
        phoneNumber: userPhoneNumber,
        email: user.email || null,
      });
    }

    // Update user's contact permission
    await User.findByIdAndUpdate(userId, { 
      contactPermission: true 
    });

    console.log('✅ User contact permission updated');

    // Prepare bulk operations for better performance
    const bulkOps = contacts.map(contact => ({
      updateOne: {
        filter: { 
          userId, 
          phoneNumber: contact.phoneNumber 
        },
        update: {
          $set: {
            name: contact.name,
            email: contact.email || null,
            syncedAt: new Date(),
          }
        },
        upsert: true,
      }
    }));

    // Execute bulk operation
    const result = await Contact.bulkWrite(bulkOps);

    console.log('✅ Contacts synced:', {
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      total: contacts.length
    });

    res.status(200).json({
      success: true,
      message: 'Contacts synced successfully',
      data: {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        total: contacts.length,
      }
    });
  } catch (error) {
    console.error('❌ Error syncing contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync contacts',
      error: error.message 
    });
  }
};

// Get all contacts (for user)
export const getMyContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, search = '' } = req.query;

    const query = { userId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 })
      .select('-__v');

    const count = await Contact.countDocuments(query);

    res.status(200).json({
      success: true,
      data: contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contacts',
      error: error.message 
    });
  }
};

// Get all contacts for all users (Admin only)
export const getAllContacts = async (req, res) => {
  try {
    console.log('🔹 Fetching all contacts...');
    const { page = 1, limit = 50, search = '', userId, userPhone } = req.query;

    console.log('📊 Query params:', { page, limit, search, userId, userPhone });

    const query = {};
    
    if (userId) {
      query.userId = userId;
    }

    // Filter by user's phone number
    if (userPhone) {
      const users = await User.find({
        phoneNumber: { $regex: userPhone, $options: 'i' }
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
      console.log('📱 Filtering by user phone:', userPhone, 'Found users:', userIds.length);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const contacts = await Contact.find(query)
      .populate('userId', 'name phoneNumber email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .select('-__v');

    const count = await Contact.countDocuments(query);

    console.log('✅ Contacts fetched:', contacts.length);
    console.log('📊 Total count:', count);

    res.status(200).json({
      success: true,
      data: contacts,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    console.error('❌ Error fetching all contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contacts',
      error: error.message 
    });
  }
};

// Get contact statistics
export const getContactStats = async (req, res) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const usersWithContacts = await Contact.distinct('userId');
    
    const recentSync = await Contact.find()
      .sort({ syncedAt: -1 })
      .limit(1)
      .select('syncedAt');

    res.status(200).json({
      success: true,
      data: {
        totalContacts,
        usersWithContacts: usersWithContacts.length,
        lastSyncedAt: recentSync.length > 0 ? recentSync[0].syncedAt : null,
      }
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch contact statistics',
      error: error.message 
    });
  }
};

// Delete user's contacts
export const deleteMyContacts = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Contact.deleteMany({ userId });

    // Update user's contact permission
    await User.findByIdAndUpdate(userId, { 
      contactPermission: false 
    });

    res.status(200).json({
      success: true,
      message: 'All contacts deleted successfully',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error deleting contacts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete contacts',
      error: error.message 
    });
  }
};
