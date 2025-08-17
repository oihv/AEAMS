const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkUsers() {
  try {
    console.log('🔍 Checking database connection...')
    console.log('📍 Database URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
    
    const userCount = await prisma.user.count()
    console.log('👥 Total users in database:', userCount)
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })
    
    console.log('📝 Users found:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Created: ${user.createdAt}`)
    })
    
    if (userCount === 0) {
      console.log('❌ No users found in database')
    } else {
      console.log(`✅ Found ${userCount} users in database`)
    }
    
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
