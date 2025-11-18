import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import Service from './src/models/Service.js';

dotenv.config();

const services = [
  {
    name: 'Wash & Iron',
    description: 'Complete washing and ironing service for your clothes. Get fresh and crisp clothes delivered to your doorstep.',
    price: 150,
    icon: '👕',
    image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400',
    isActive: true,
    estimatedDays: 2,
  },
  {
    name: 'Dry Clean',
    description: 'Professional dry cleaning for delicate fabrics and formal wear. Perfect for suits, dresses, and special garments.',
    price: 250,
    icon: '🧥',
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=400',
    isActive: true,
    estimatedDays: 3,
  },
  {
    name: 'Ironing Only',
    description: 'Expert ironing service for perfectly pressed clothes. Save time and get professional results.',
    price: 80,
    icon: '🔥',
    image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400',
    isActive: true,
    estimatedDays: 1,
  },
  {
    name: 'Premium Laundry',
    description: 'Premium laundry service with special care for expensive and delicate fabrics. Includes washing, drying, and careful pressing.',
    price: 350,
    icon: '⭐',
    image: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400',
    isActive: true,
    estimatedDays: 3,
  },
  {
    name: 'Express Service',
    description: 'Super fast laundry service for urgent needs. Get your clothes washed and delivered within 24 hours.',
    price: 200,
    icon: '⚡',
    image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400',
    isActive: true,
    estimatedDays: 1,
  },
];

const seedServices = async () => {
  try {
    await connectDB();

    // Clear existing services
    await Service.deleteMany({});
    console.log('Existing services deleted');

    // Insert new services
    const createdServices = await Service.insertMany(services);
    console.log(`${createdServices.length} services created successfully`);

    console.log('\nCreated Services:');
    createdServices.forEach((service) => {
      console.log(`- ${service.name}: ₹${service.price}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
};

seedServices();
