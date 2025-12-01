import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Contact from './src/models/Contact.js';
import User from './src/models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Error:', error);
    process.exit(1);
  }
};

const checkContacts = async () => {
  try {
    console.log('\n========================================');
    console.log('📊 DATABASE CONTACT VERIFICATION');
    console.log('========================================\n');

    const users = await User.find().select('name phoneNumber email');
    console.log(`👥 Total Users: ${users.length}\n`);

    for (const user of users) {
      const contactCount = await Contact.countDocuments({ userId: user._id });
      
      console.log('----------------------------------------');
      console.log(`👤 User: ${user.name || 'Unknown'}`);
      console.log(`   📱 Phone: ${user.phoneNumber}`);
      console.log(`   📧 Email: ${user.email || 'N/A'}`);
      console.log(`   📞 Total Contacts: ${contactCount}`);
      
      if (contactCount > 0) {
        const contacts = await Contact.find({ userId: user._id })
          .limit(5)
          .select('name phoneNumber email syncedAt');
        
        console.log('\n   📋 Sample Contacts:');
        contacts.forEach((c, i) => {
          console.log(`      ${i + 1}. ${c.name}`);
          console.log(`         📞 ${c.phoneNumber}`);
          console.log(`         📧 ${c.email || 'N/A'}`);
          console.log(`         🕒 ${c.syncedAt?.toISOString() || 'N/A'}`);
        });
      } else {
        console.log('   ⚠️  No contacts found for this user');
      }
      console.log('');
    }

    const totalContacts = await Contact.countDocuments();
    console.log('========================================');
    console.log(`📊 TOTAL CONTACTS IN DATABASE: ${totalContacts}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Connection closed');
  }
};

connectDB().then(() => checkContacts());
