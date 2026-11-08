import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. Categories (Cancellation Deals REMOVED as requested!)
  console.log('1. Seeding categories...');
  const categoriesData = [
    { name: 'Location', filterKey: 'location', order: 1, iconName: 'MapPin' },
    { name: 'Featured', filterKey: 'featured', order: 2, iconName: 'Sparkles' },
    { name: 'Turf', filterKey: 'hasTurf', order: 3, iconName: 'Tent' },
    { name: 'Big Pools', filterKey: 'hasPool', order: 4, iconName: 'Droplet' },
    { name: 'Couple Friendly', filterKey: 'isCoupleFriendly', order: 5, iconName: 'Users' },
    { name: 'Pet Friendly', filterKey: 'isPetFriendly', order: 6, iconName: 'Dog' },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { filterKey: cat.filterKey, order: cat.order, iconName: cat.iconName },
      create: { ...cat, isActive: true },
    });
  }

  // 2. Users (Admin, Owner, Guest)
  console.log('2. Seeding users...');
  const adminPasswordHash = await bcrypt.hash('Maikada@123', 10);
  const defaultPasswordHash = await bcrypt.hash('Staygrid123!', 10);

  // System Admin: sami@staygrid.com (Password: Maikada@123)
  const adminUser1 = await prisma.user.upsert({
    where: { email: 'sami@staygrid.com' },
    update: {
      role: Role.ADMIN,
    },
    create: {
      email: 'sami@staygrid.com',
      name: 'Sami Momin (System Admin)',
      phone: '+919820098200',
      role: Role.ADMIN,
      accounts: {
        create: {
          accountId: 'sami@staygrid.com',
          providerId: 'credential',
          password: adminPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  // Default Admin: admin@staygrid.in (Password: Maikada@123)
  await prisma.user.upsert({
    where: { email: 'admin@staygrid.in' },
    update: {
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@staygrid.in',
      name: 'StayGrid Admin',
      phone: '+919876543210',
      role: Role.ADMIN,
      accounts: {
        create: {
          accountId: 'admin@staygrid.in',
          providerId: 'credential',
          password: adminPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@staygrid.in' },
    update: {},
    create: {
      email: 'owner@staygrid.in',
      name: 'Samyy Momin (Host)',
      phone: '+919820098200',
      role: Role.OWNER,
      accounts: {
        create: {
          accountId: 'owner@staygrid.in',
          providerId: 'credential',
          password: defaultPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  const guestUser = await prisma.user.upsert({
    where: { email: 'guest@staygrid.in' },
    update: {},
    create: {
      email: 'guest@staygrid.in',
      name: 'Rohan Sharma',
      phone: '+919988776655',
      role: Role.CUSTOMER,
      accounts: {
        create: {
          accountId: 'guest@staygrid.in',
          providerId: 'credential',
          password: defaultPasswordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
  });

  // 3. Farmhouses
  console.log('3. Seeding luxury farmhouses...');
  const farmhouse1 = await prisma.farmhouse.create({
    data: {
      title: 'Zain Villa Resort & Private Pool',
      city: 'Bhiwandi',
      state: 'Maharashtra',
      streetAddress: 'Plot 42, Green Valley Estate, Off Nashik Highway, Bhiwandi',
      price12Hours: 5000,
      price24Hours: 8000,
      defaultCommissionPercentage: 20.0,
      roomCount: 4,
      acRoomCount: 4,
      nonAcRoomCount: 0,
      hallCount: 2,
      singleBedCount: 4,
      doubleBedCount: 4,
      extraMattressCount: 10,
      balconyCount: 2,
      hasPool: true,
      poolType: 'ATTACHED',
      poolSize: '20x40 ft',
      babyPoolSize: '6x6 ft',
      hasTurf: true,
      hasRainDance: true,
      hasPlayArea: true,
      hasGardenArea: true,
      hasKitchen: true,
      hasFridge: true,
      hasWifi: true,
      hasTv: true,
      isCoupleFriendly: true,
      isPetFriendly: true,
      isFeatured: true,
      photos: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
      ],
      ownerId: ownerUser.id,
    },
  });

  const farmhouse2 = await prisma.farmhouse.create({
    data: {
      title: 'Royal Palms Luxury Estate',
      city: 'Igatpuri',
      state: 'Maharashtra',
      streetAddress: 'Near Bhavali Dam Road, Igatpuri Hill Station',
      price12Hours: 6500,
      price24Hours: 10000,
      defaultCommissionPercentage: 20.0,
      roomCount: 5,
      acRoomCount: 5,
      nonAcRoomCount: 0,
      hallCount: 2,
      singleBedCount: 6,
      doubleBedCount: 5,
      extraMattressCount: 12,
      balconyCount: 3,
      hasPool: true,
      poolType: 'SEPARATE',
      poolSize: '25x50 ft',
      babyPoolSize: '8x8 ft',
      hasTurf: true,
      hasRainDance: true,
      hasPlayArea: true,
      hasGardenArea: true,
      hasKitchen: true,
      hasFridge: true,
      hasWifi: true,
      hasTv: true,
      isCoupleFriendly: true,
      isPetFriendly: true,
      isFeatured: true,
      photos: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      ],
      ownerId: ownerUser.id,
    },
  });

  // 4. Hero Banners
  console.log('4. Seeding hero banners...');
  await prisma.heroBanner.createMany({
    data: [
      {
        heading: 'Escape to Luxury Farmhouses',
        subheading: 'Book Private Pool Villas & Turf Estates at 20% Token Amount',
        buttonText: 'Explore Stays',
        imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
        order: 1,
      },
      {
        heading: 'Weekend Getaways Made Easy',
        subheading: '100% Verified Caretakers & Direct Host Connect',
        buttonText: 'Book Now',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        order: 2,
      },
    ],
  });

  // 5. Sample Bookings & Financial Activity
  console.log('5. Seeding bookings...');
  const now = new Date();
  const checkIn1 = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
  const checkOut1 = new Date(now.getTime() + 3 * 24 * 3600 * 1000);

  const booking1 = await prisma.booking.create({
    data: {
      checkIn: checkIn1,
      checkOut: checkOut1,
      adults: 8,
      children: 2,
      totalAmount: 10000,
      tokenPaid: 2000,
      status: 'CONFIRMED',
      commissionPercentage: 20.0,
      staygridNetCommission: 2000,
      ownerShareAmount: 8000,
      cashPaymentConfirmedByOwner: true,
      cashPaymentConfirmedByUser: true,
      ownerPayoutStatus: 'PENDING',
      accountingStatus: 'UNCLOSED',
      userId: guestUser.id,
      farmhouseId: farmhouse1.id,
    },
  });

  await prisma.financialTransaction.createMany({
    data: [
      {
        bookingId: booking1.id,
        type: 'CUSTOMER_TOKEN',
        amount: 2000,
        direction: 'INFLOW',
        fromEntity: 'CUSTOMER',
        toEntity: 'STAYGRID',
        notes: 'Online 20% token payment received via Razorpay',
      },
      {
        bookingId: booking1.id,
        type: 'OWNER_CASH_COLLECTION',
        amount: 8000,
        direction: 'INFLOW',
        fromEntity: 'CUSTOMER',
        toEntity: 'OWNER',
        notes: 'Check-in cash ₹8,000 confirmed by Caretaker',
      },
    ],
  });

  // 6. Instagram Reels & Photo Explore Media
  console.log('6. Seeding Instagram Reels & Explore media...');
  await prisma.exploreMedia.createMany({
    data: [
      {
        type: 'REEL',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-swimming-pool-in-a-luxurious-resort-41484-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
        instagramPostUrl: 'https://www.instagram.com/staygridmumbai',
        caption: '🔥 Massive Private Infinity Pool at Zain Villa! Tag your gang 🏊',
        viewCount: 15420,
        isFeatured: true,
        farmhouseId: farmhouse1.id,
      },
      {
        type: 'REEL',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-resort-and-swimming-pool-41482-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
        instagramPostUrl: 'https://www.instagram.com/staygridmumbai',
        caption: '⭐ Royal Palms Estate 5BHK Luxury Tour with Turf Grounds 🏏',
        viewCount: 22890,
        isFeatured: true,
        farmhouseId: farmhouse2.id,
      },
      {
        type: 'PHOTO',
        mediaUrl: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
        caption: 'Night Pool Glow at Zain Villa 🌙✨',
        viewCount: 8930,
        isFeatured: false,
        farmhouseId: farmhouse1.id,
      },
      {
        type: 'PHOTO',
        mediaUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        caption: 'Spacious Gazebo Lounge & Barbecue area 🍖🔥',
        viewCount: 12400,
        isFeatured: false,
        farmhouseId: farmhouse2.id,
      },
    ],
  });

  // 7. Reviews
  console.log('7. Seeding reviews...');
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Absolutely incredible stay! The pool was massive and spotless. We had a great time with family.',
      groupType: 'Friends Group',
      farmhouseId: farmhouse1.id,
      userId: guestUser.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
