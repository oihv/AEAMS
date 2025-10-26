# AEAMS - Agricultural Environmental Automated Monitoring System

A Next.js-based web application for monitoring agricultural sensor data from IoT devices (rods) deployed in farms. The system provides real-time environmental monitoring, AI-powered recommendations for watering and fertilizing, and ML-based predictions.

## Features

- **User Authentication**: Secure sign-up/sign-in with NextAuth
- **Farm Management**: Create and manage multiple farms with custom plant types
- **IoT Device Integration**: Connect main rods and secondary sensor rods
- **Real-time Monitoring**: Track temperature, moisture, pH, conductivity, NPK levels, and battery status
- **AI Recommendations**: Get intelligent watering and fertilizing suggestions using DeepSeek AI
- **ML Predictions**: TensorFlow-powered predictive analytics
- **Interactive Dashboard**: Drag-and-drop rod positioning with visual feedback
- **Notifications**: Real-time alerts for critical sensor readings

## Prerequisites

- Node.js (v20 or higher)
- PostgreSQL database
- HuggingFace API token (optional, for AI features)

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AEAMS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/aeams"

# NextAuth Configuration  
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# HuggingFace API Configuration (Optional)
HF_TOKEN="your-huggingface-token-here"
```

**Important:**
- Replace `username:password` with your PostgreSQL credentials
- Generate a secure random string for `NEXTAUTH_SECRET`
- Get HuggingFace token from: https://huggingface.co/settings/tokens

### 4. Setup Database

Generate Prisma client and push schema to database:

```bash
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run db:studio` - Open Prisma Studio for database management
- `npm run db:reset` - Reset database (warning: deletes all data)

## Project Structure

- `/app` - Next.js app router pages and API routes
- `/components` - React components
- `/lib` - Utility libraries (AI engine, ML engine, caching)
- `/prisma` - Database schema and migrations
- `/types` - TypeScript type definitions
- `/tests` - Test files
- `/scripts` - Utility scripts for data push and testing

## Database Models

- **User**: Authentication and user management
- **Farm**: Farm entities with plant types
- **MainRod**: Primary IoT devices
- **SecondaryRod**: Sensor rods with position tracking
- **Reading**: Environmental sensor data
- **AISuggestion**: AI-generated recommendations

## API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/farms/*` - Farm management
- `/api/rod/*` - Rod data and positioning
- `/api/ai-suggestions/*` - AI recommendations
- `/api/ml/predictions/*` - ML predictions
- `/api/health` - Health check

## Documentation

- [AI Testing Guide](docs/AI-TESTING-GUIDE.md)
- [ML Features](docs/ML-FEATURES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Data Push Guide](DATA-PUSH-README.md)

## Testing

Run the test suite:

```bash
npm test
```

Run tests with UI:

```bash
npm run test:ui
```

## License

See [LICENSE](LICENSE) file for details.
