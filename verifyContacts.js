import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const verifyContacts = async () => {
  await connectDB();

  const Contact = mongoose.model('Contact', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phoneNumber: String,
    email: String,
    syncedAt: Date,
  }));

  const User = mongoose.model('User', new mongoose.Schema({
    phoneNumber: String,
    name: String,
    contactPermission: Boolean,
  }));

  try {
    console.log('\n========================================');
    console.log('🔍 VERIFYING CONTACTS IN DATABASE');
    console.log('========================================\n');

    // Count total contacts
    const totalContacts = await Contact.countDocuments();
    console.log('📊 Total contacts in database:', totalContacts);

    // Count users with contacts
    const usersWithContacts = await Contact.distinct('userId');
    console.log('👥 Users with contacts:', usersWithContacts.length);

    // Get users with contactPermission = true
    const usersWithPermission = await User.countDocuments({ contactPermission: true });
    console.log('✅ Users with contactPermission = true:', usersWithPermission);

    // Get users with contactPermission = false
    const usersWithoutPermission = await User.countDocuments({ contactPermission: false });
    console.log('❌ Users with contactPermission = false:', usersWithoutPermission);

    // Sample contacts
    console.log('\n📋 Sample Contacts (first 5):');
    const sampleContacts = await Contact.find()
      .populate('userId', 'name phoneNumber contactPermission')
      .limit(5)
      .sort({ createdAt: -1 });

    sampleContacts.forEach((contact, index) => {
      console.log(`\n${index + 1}. Contact Details:`);
      console.log(`   Name: ${contact.name}`);
      console.log(`   Phone: ${contact.phoneNumber}`);
      console.log(`   User: ${contact.userId?.name || 'Unknown'} (${contact.userId?.phoneNumber || 'N/A'})`);
      console.log(`   Permission: ${contact.userId?.contactPermission ? '✅' : '❌'}`);
      console.log(`   Synced: ${contact.syncedAt}`);
    });

    console.log('\n========================================');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('========================================\n');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

verifyContacts();
