const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Trip = require('./models/Trip');
const Coupon = require('./models/Coupon');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    // await User.deleteMany(); // Commented to preserve manual users
    // Data scrubbing removed to preserve manual entries
    // console.log('Data Cleared!');

    // Create Admin
    let admin = await User.findOne({ email: 'utsav@admin.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin Utsav',
        email: 'utsav@admin.com',
        password: 'Utsav@123',
        role: 'admin',
        phone: '1234567890'
      });
      console.log('Admin Created!');
    } else {
      console.log('Admin already exists, skipping creation.');
    }
    // Create Coupons (10 types)
    const coupons = [
      { title: '10% Discount', code: 'SAVE10', description: 'Get 10% off your next booking.', discountType: 'percentage', discountValue: 10, expiryDate: new Date('2026-12-31') },
      { title: '20% Discount', code: 'SAVE20', description: 'Get 20% off your next booking.', discountType: 'percentage', discountValue: 20, expiryDate: new Date('2026-12-31') },
      { title: '30% Discount', code: 'SAVE30', description: 'Huge 30% discount on any trip.', discountType: 'percentage', discountValue: 30, expiryDate: new Date('2026-12-31') },
      { title: '50% Discount', code: 'HALFPRICE', description: 'Massive 50% discount! Limited time.', discountType: 'percentage', discountValue: 50, expiryDate: new Date('2026-12-31') },
      { title: 'Free Food (One Time)', code: 'FREEFOOD', description: 'Enjoy a free complementary meal during your trip.', discountType: 'freebie', freebieDescription: '1x Free Meal', expiryDate: new Date('2026-12-31') },
      { title: 'Free Hotel Night', code: 'FREEHOTEL', description: 'Get one free night at our partner hotels.', discountType: 'freebie', freebieDescription: '1x Hotel Night', expiryDate: new Date('2026-12-31') },
      { title: 'Free Transport', code: 'FREETRANS', description: 'Free pickup and drop transport service.', discountType: 'freebie', freebieDescription: 'Airport/Hotel Transfer', expiryDate: new Date('2026-12-31') },
      { title: 'Free Breakfast', code: 'FREEBKFST', description: 'Enjoy free breakfast for the duration of the trip.', discountType: 'freebie', freebieDescription: 'Daily Breakfast', expiryDate: new Date('2026-12-31') },
      { title: 'Free Tour Guide', code: 'FREEGUIDE', description: 'Get a personal local tour guide for free.', discountType: 'freebie', freebieDescription: 'Local Tour Guide', expiryDate: new Date('2026-12-31') },
      { title: 'Surprise Gift', code: 'SURPRISE', description: 'Receive a special surprise gift on departure.', discountType: 'freebie', freebieDescription: 'Mystery CAPPSRA Gift', expiryDate: new Date('2026-12-31') },
    ];

    // Create 20+ Trips (Airlines style)
    const trips = [
      { name: 'Swiss Alps Getaway', airline: 'Swiss International Air Lines', from: 'New York (JFK)', to: 'Zurich (ZRH)', location: 'Switzerland', description: 'Experience the breathtaking Swiss Alps.', price: 1200, startDate: new Date('2026-05-01'), endDate: new Date('2026-05-08'), availableSeats: 154, category: 'International' },
      { name: 'Paris City of Love', airline: 'Air France', from: 'London (LHR)', to: 'Paris (CDG)', location: 'France', description: 'Explore the romance of Paris.', price: 850, startDate: new Date('2026-05-02'), endDate: new Date('2026-05-07'), availableSeats: 200, category: 'International' },
      { name: 'Tokyo Neon Nights', airline: 'Japan Airlines (JAL)', from: 'Los Angeles (LAX)', to: 'Tokyo (NRT)', location: 'Japan', description: 'Discover the futuristic city of Tokyo.', price: 1500, startDate: new Date('2026-06-10'), endDate: new Date('2026-06-20'), availableSeats: 120, category: 'International' },
      { name: 'Bali Tropical Paradise', airline: 'Garuda Indonesia', from: 'Sydney (SYD)', to: 'Denpasar (DPS)', location: 'Indonesia', description: 'Relax on the beautiful beaches of Bali.', price: 900, startDate: new Date('2026-07-01'), endDate: new Date('2026-07-09'), availableSeats: 180, category: 'International' },
      { name: 'Greek Islands Cruise', airline: 'Aegean Airlines', from: 'Athens (ATH)', to: 'Santorini (JTR)', location: 'Greece', description: 'Sail through the stunning Greek islands.', price: 1100, startDate: new Date('2026-08-15'), endDate: new Date('2026-08-22'), availableSeats: 100, category: 'International' },
      { name: 'Dubai Luxury Experience', airline: 'Emirates', from: 'London (LHR)', to: 'Dubai (DXB)', location: 'UAE', description: 'Experience pure luxury in Dubai.', price: 2000, startDate: new Date('2026-09-05'), endDate: new Date('2026-09-11'), availableSeats: 300, category: 'International' },
      { name: 'Maldives Overwater Villas', airline: 'Qatar Airways', from: 'Doha (DOH)', to: 'Male (MLE)', location: 'Maldives', description: 'Stay in breathtaking overwater villas.', price: 2500, startDate: new Date('2026-10-12'), endDate: new Date('2026-10-19'), availableSeats: 80, category: 'International' },
      { name: 'New York City Explorer', airline: 'Delta Air Lines', from: 'Chicago (ORD)', to: 'New York (JFK)', location: 'USA', description: 'Discover the concrete jungle.', price: 500, startDate: new Date('2026-11-01'), endDate: new Date('2026-11-05'), availableSeats: 150, category: 'Domestic' },
      { name: 'London Historical Tour', airline: 'British Airways', from: 'New York (JFK)', to: 'London (LHR)', location: 'UK', description: 'Explore the rich history of London.', price: 1000, startDate: new Date('2026-12-05'), endDate: new Date('2026-12-11'), availableSeats: 220, category: 'International' },
      { name: 'Rome Ancient Ruins', airline: 'ITA Airways', from: 'Paris (CDG)', to: 'Rome (FCO)', location: 'Italy', description: 'Walk through ancient Roman history.', price: 800, startDate: new Date('2026-04-10'), endDate: new Date('2026-04-15'), availableSeats: 160, category: 'International' },
      { name: 'Hawaii Volcanic Adventure', airline: 'Hawaiian Airlines', from: 'Los Angeles (LAX)', to: 'Honolulu (HNL)', location: 'USA', description: 'Explore live volcanoes and beaches.', price: 1100, startDate: new Date('2026-05-20'), endDate: new Date('2026-05-28'), availableSeats: 140, category: 'Domestic' },
      { name: 'Cairo Pyramids Quest', airline: 'EgyptAir', from: 'London (LHR)', to: 'Cairo (CAI)', location: 'Egypt', description: 'See the great Pyramids of Giza.', price: 950, startDate: new Date('2026-06-05'), endDate: new Date('2026-06-11'), availableSeats: 190, category: 'International' },
      { name: 'Cape Town Safari Safari', airline: 'South African Airways', from: 'Johannesburg (JNB)', to: 'Cape Town (CPT)', location: 'South Africa', description: 'Experience incredible wildlife.', price: 1300, startDate: new Date('2026-07-15'), endDate: new Date('2026-07-25'), availableSeats: 110, category: 'Domestic' },
      { name: 'Rio Carnival Spectacle', airline: 'LATAM Airlines', from: 'Miami (MIA)', to: 'Rio de Janeiro (GIG)', location: 'Brazil', description: 'Join the biggest party on Earth.', price: 1400, startDate: new Date('2026-02-12'), endDate: new Date('2026-02-19'), availableSeats: 170, category: 'International' },
      { name: 'Singapore City Guide', airline: 'Singapore Airlines', from: 'Sydney (SYD)', to: 'Singapore (SIN)', location: 'Singapore', description: 'Explore the futuristic island city.', price: 1050, startDate: new Date('2026-03-08'), endDate: new Date('2026-03-13'), availableSeats: 210, category: 'International' },
      { name: 'Sydney Opera & Harbour', airline: 'Qantas', from: 'Auckland (AKL)', to: 'Sydney (SYD)', location: 'Australia', description: 'See the iconic Sydney Opera House.', price: 600, startDate: new Date('2026-04-20'), endDate: new Date('2026-04-24'), availableSeats: 180, category: 'International' },
      { name: 'Vancouver Mountain Retreat', airline: 'Air Canada', from: 'Toronto (YYZ)', to: 'Vancouver (YVR)', location: 'Canada', description: 'Ski and hike in beautiful mountains.', price: 700, startDate: new Date('2026-08-05'), endDate: new Date('2026-08-11'), availableSeats: 150, category: 'Domestic' },
      { name: 'Bangkok Street Food Tour', airline: 'Thai Airways', from: 'Singapore (SIN)', to: 'Bangkok (BKK)', location: 'Thailand', description: 'Taste the best street food in Asia.', price: 400, startDate: new Date('2026-09-12'), endDate: new Date('2026-09-16'), availableSeats: 200, category: 'International' },
      { name: 'Istanbul Two Continents', airline: 'Turkish Airlines', from: 'Berlin (BER)', to: 'Istanbul (IST)', location: 'Turkey', description: 'Where Europe meets Asia.', price: 750, startDate: new Date('2026-10-20'), endDate: new Date('2026-10-25'), availableSeats: 160, category: 'International' },
      { name: 'Amsterdam Canal Cruise', airline: 'KLM Royal Dutch Airlines', from: 'London (LHR)', to: 'Amsterdam (AMS)', location: 'Netherlands', description: 'Cruise through historic canals.', price: 550, startDate: new Date('2026-05-15'), endDate: new Date('2026-05-18'), availableSeats: 130, category: 'International' },
      { name: 'Seoul Pop Culture', airline: 'Korean Air', from: 'Tokyo (NRT)', to: 'Seoul (ICN)', location: 'South Korea', description: 'Dive into K-Pop and modern Seoul.', price: 650, startDate: new Date('2026-06-22'), endDate: new Date('2026-06-27'), availableSeats: 190, category: 'International' }
    ];
    // Create Coupons (Safe Seed)
    let couponsCreated = 0;
    for (const c of coupons) {
      const exists = await Coupon.findOne({ code: c.code });
      if (!exists) {
        await Coupon.create(c);
        couponsCreated++;
      }
    }
    console.log(`${couponsCreated} New Coupons Created!`);

    // Create Trips (Safe Seed)
    let tripsCreated = 0;
    for (const t of trips) {
      const exists = await Trip.findOne({ name: t.name });
      if (!exists) {
        await Trip.create(t);
        tripsCreated++;
      }
    }
    console.log(`${tripsCreated} New Airline Trips Created!`);

    console.log('✅ SEEDING SUCCESSFUL');
    process.exit();
  } catch (error) {
    console.error(`❌ ${error}`);
    process.exit(1);
  }
};

seedData();
