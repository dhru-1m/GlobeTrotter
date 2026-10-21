
## __Problem Statement:__ _GlobeTrotter – Empowering Personalized Travel Planning_
GlobeTrotter aims to be a personalized, intelligent platform that redefines travel planning. It empowers users to dream, design, and organize trips effortlessly with flexible, interactive tools. By enabling exploration of global destinations, visualizing itineraries, making cost-effective choices, and sharing plans within a community, it makes planning as exciting as the journey itself.

---

### Demo video at: [demo](https://drive.google.com/file/d/1Xz20vnRqj74uZvVUq9tfKbSSNXmT9bFp/view?usp=sharing)

---

 ### <u>Team:</u> ___Epoch Wizards___
---
 <!-- ### <ins>__Team members with email__</ins>  -->
 
| Name | Email |  
| :-------| -----|  
| Aryan Vadhadiya | aryanvadhadiya1@gmail.com|
| Aryan Dawra | aryandawra2020@gmail.com |
| Het Patel | phet30440@gmail.com |
| Hardatt Mangrola | hardattmangrola55@gmail.com|
=======
# GlobeTrotter - Multi-City Travel Planning Application

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) travel planning application that enables users to create, manage, and share personalized multi-city itineraries with activities, budgets, and timelines.

## 🌟 Features

### Core Features
- **User Authentication**: Secure login/signup with JWT, password reset functionality
- **Trip Management**: Create, edit, delete, and organize trips with multiple destinations
- **Itinerary Builder**: Drag-and-drop interface for planning activities and destinations
- **Activity Management**: Add, edit, and organize activities with time slots and costs
- **Budget Tracking**: Real-time budget calculations and expense breakdowns
- **City Search**: Search and filter cities by name, country, cost, and popularity
- **Public Sharing**: Generate shareable links for trips
- **Responsive Design**: Mobile-first design that works on all devices

### Advanced Features
- **Real-time Collaboration**: Share trips with other users
- **Calendar View**: Visual timeline of trip activities
- **Budget Forecasting**: AI-powered budget recommendations
- **Export Functionality**: Export trip data and budgets
- **Notification System**: Real-time updates and reminders
- **Advanced Search**: Filter trips by status, date, and destination

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Multer** - File uploads
- **Nodemailer** - Email functionality
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Query** - Data fetching
- **React Beautiful DnD** - Drag and drop
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GlobeTrotter
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/globetrotter
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend development server**
   ```bash
   npm start
   ```

### Database Setup

1. **MongoDB Local Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Create a database named `globetrotter`
   - The application will automatically create collections

2. **Seed Data (Optional)**
   ```bash
   cd backend
   npm run seed
   ```

## 🚀 Usage

### Starting the Application

1. **Development Mode**
   ```bash
   # From root directory
   npm run dev
   ```
   This will start both backend (port 5000) and frontend (port 3000)

2. **Production Mode**
   ```bash
   # Build frontend
   cd frontend
   npm run build
   
   # Start production server
   cd ../backend
   npm start
   ```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update profile
- `POST /api/auth/forgotpassword` - Forgot password
- `PUT /api/auth/resetpassword/:token` - Reset password

#### Trips
- `GET /api/trips` - Get user trips
- `POST /api/trips` - Create new trip
- `GET /api/trips/:id` - Get single trip
- `PUT /api/trips/:id` - Update trip
- `DELETE /api/trips/:id` - Delete trip
- `GET /api/trips/public/:publicUrl` - Get public trip

#### Itinerary
- `GET /api/itinerary/:tripId` - Get trip itinerary
- `POST /api/itinerary/:tripId/destinations` - Add destination
- `PUT /api/itinerary/:tripId/destinations/:id` - Update destination
- `DELETE /api/itinerary/:tripId/destinations/:id` - Remove destination

#### Activities
- `GET /api/activities` - Get activities
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

#### Cities
- `GET /api/cities` - Search cities
- `GET /api/cities/popular` - Get popular cities
- `GET /api/cities/nearby` - Get nearby cities

#### Budget
- `GET /api/budget/:tripId` - Get trip budget
- `PUT /api/budget/:tripId` - Update budget
- `GET /api/budget/:tripId/forecast` - Get budget forecast

## 📁 Project Structure

```
GlobeTrotter/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── server.js        # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── store/       # Redux store
│   │   ├── services/    # API services
│   │   ├── utils/       # Utility functions
│   │   └── App.js       # Main app component
│   └── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `EMAIL_SERVICE` - Email service provider
- `EMAIL_USER` - Email username
- `EMAIL_PASS` - Email password
- `CLIENT_URL` - Frontend URL

### Database Schema

#### User Model
- Basic info (name, email, password)
- Profile preferences
- Saved destinations
- Authentication tokens

#### Trip Model
- Trip details (name, dates, description)
- Destinations array
- Budget information
- Collaboration settings
- Public sharing options

#### Activity Model
- Activity details (title, description, type)
- Time and location
- Cost information
- Booking details
- Images and tags

#### City Model
- City information (name, country, coordinates)
- Cost index and popularity
- Climate and attractions
- Transportation options

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku/Render)
1. Set environment variables
2. Configure MongoDB connection
3. Deploy using Git integration

### Frontend Deployment (Vercel/Netlify)
1. Build the application
2. Configure environment variables
3. Deploy using Git integration


## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] AI-powered trip recommendations
- [ ] Social features (following, likes)
- [ ] Advanced analytics dashboard
- [ ] Integration with booking platforms
- [ ] Offline functionality
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Trip templates
- [ ] Weather integration

---

**GlobeTrotter** - Plan your perfect journey, one destination at a time! 🌍✈️ 

