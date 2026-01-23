import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in .env file');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@ecommerce.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'ADMIN',
            address: '123 Admin Street, NY',
            phone: '+1234567890'
        }
    });

    const user1 = await prisma.user.create({
        data: {
            email: 'john@example.com',
            password: hashedPassword,
            name: 'John Doe',
            role: 'USER',
            address: '456 User Ave, CA',
            phone: '+1234567891'
        }
    });

    const user2 = await prisma.user.create({
        data: {
            email: 'jane@example.com',
            password: hashedPassword,
            name: 'Jane Smith',
            role: 'USER',
            address: '789 Customer Blvd, TX',
            phone: '+1234567892'
        }
    });

    console.log(`✅ Created ${3} users`);

    // Create Categories
    console.log('Creating categories...');
    const electronics = await prisma.category.create({
        data: {
            name: 'Electronics'
        }
    });

    const clothing = await prisma.category.create({
        data: {
            name: 'Clothing'
        }
    });

    const books = await prisma.category.create({
        data: {
            name: 'Books'
        }
    });

    const home = await prisma.category.create({
        data: {
            name: 'Home & Garden'
        }
    });

    console.log(`✅ Created ${4} categories`);

    // Create Products
    console.log('Creating products...');

    // Electronics Products
    await prisma.product.createMany({
        data: [
            {
                name: 'iPhone 15 Pro',
                description: 'Latest Apple iPhone with A17 Pro chip',
                price: 999.99,
                stock: 50,
                categoryId: electronics.id,
                images: ['iphone15.jpg']
            },
            {
                name: 'MacBook Pro 16"',
                description: 'Powerful laptop with M3 Max chip',
                price: 2499.99,
                stock: 25,
                categoryId: electronics.id,
                images: ['macbook.jpg']
            },
            {
                name: 'AirPods Pro',
                description: 'Wireless earbuds with active noise cancellation',
                price: 249.99,
                stock: 100,
                categoryId: electronics.id,
                images: ['airpods.jpg']
            },
            {
                name: 'Samsung Galaxy S24',
                description: 'Flagship Android smartphone',
                price: 899.99,
                stock: 60,
                categoryId: electronics.id,
                images: ['galaxy.jpg']
            },
            {
                name: 'Sony WH-1000XM5',
                description: 'Premium noise-canceling headphones',
                price: 399.99,
                stock: 40,
                categoryId: electronics.id,
                images: ['sony-headphones.jpg']
            }
        ]
    });

    // Clothing Products
    await prisma.product.createMany({
        data: [
            {
                name: 'Nike Air Max Sneakers',
                description: 'Comfortable running shoes',
                price: 129.99,
                stock: 80,
                categoryId: clothing.id,
                images: ['nike-shoes.jpg']
            },
            {
                name: 'Levi\'s 501 Jeans',
                description: 'Classic straight fit jeans',
                price: 79.99,
                stock: 120,
                categoryId: clothing.id,
                images: ['levis-jeans.jpg']
            },
            {
                name: 'North Face Jacket',
                description: 'Waterproof outdoor jacket',
                price: 199.99,
                stock: 45,
                categoryId: clothing.id,
                images: ['northface.jpg']
            },
            {
                name: 'Adidas T-Shirt',
                description: 'Comfortable cotton t-shirt',
                price: 29.99,
                stock: 200,
                categoryId: clothing.id,
                images: ['adidas-shirt.jpg']
            }
        ]
    });

    // Books
    await prisma.product.createMany({
        data: [
            {
                name: 'Clean Code',
                description: 'A Handbook of Agile Software Craftsmanship',
                price: 44.99,
                stock: 30,
                categoryId: books.id,
                images: ['clean-code.jpg']
            },
            {
                name: 'The Pragmatic Programmer',
                description: 'Your Journey To Mastery',
                price: 49.99,
                stock: 25,
                categoryId: books.id,
                images: ['pragmatic.jpg']
            },
            {
                name: 'Atomic Habits',
                description: 'An Easy & Proven Way to Build Good Habits',
                price: 16.99,
                stock: 100,
                categoryId: books.id,
                images: ['atomic-habits.jpg']
            }
        ]
    });

    // Home & Garden
    await prisma.product.createMany({
        data: [
            {
                name: 'Dyson V15 Vacuum',
                description: 'Cordless vacuum with laser detection',
                price: 649.99,
                stock: 15,
                categoryId: home.id,
                images: ['dyson.jpg']
            },
            {
                name: 'Instant Pot Duo',
                description: '7-in-1 electric pressure cooker',
                price: 99.99,
                stock: 50,
                categoryId: home.id,
                images: ['instantpot.jpg']
            },
            {
                name: 'Smart LED Bulbs (4-pack)',
                description: 'WiFi enabled color changing bulbs',
                price: 39.99,
                stock: 75,
                categoryId: home.id,
                images: ['led-bulbs.jpg']
            }
        ]
    });

    const productCount = await prisma.product.count();
    console.log(`✅ Created ${productCount} products`);

    console.log('🎉 Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: 3 (1 admin, 2 regular users)`);
    console.log(`- Categories: 4`);
    console.log(`- Products: ${productCount}`);
    console.log('\n🔑 Login credentials:');
    console.log('Admin: admin@ecommerce.com / password123');
    console.log('User 1: john@example.com / password123');
    console.log('User 2: jane@example.com / password123');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
