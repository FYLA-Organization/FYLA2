# FYLA2 - Social Beauty Service Booking Platform

FYLA2 is a comprehensive social media and beauty service booking platform that combines the best features of Booksy, StyleSeat, The Cut, and Instagram into one powerful application.

## 🌟 Features

### Core Functionality
- **User Authentication & Authorization** - JWT-based secure authentication
- **Service Provider Management** - Complete business profile management
- **Service Booking System** - Real-time availability and booking management
- **Real-time Messaging** - SignalR-powered chat system
- **Payment Processing** - Stripe integration for secure payments
- **Business Analytics** - Comprehensive dashboard and reporting
- **Social Media Features** - Posts, likes, follows, and portfolio sharing

### User Types
- **Service Providers** - Barbers, nail technicians, makeup artists, tutors, etc.
- **Clients** - Anyone looking for beauty/personal services

### Key Features
- 📅 **Smart Booking System** with availability management
- 💬 **Real-time Chat** between providers and clients
- 📊 **Analytics Dashboard** for business insights
- 💳 **Secure Payments** with Stripe integration
- 🌟 **Review & Rating System**
- 📱 **Social Media Feed** with posts and interactions
- 🎨 **Portfolio Management** for showcasing work
- 📍 **Location-based Search**
- 📈 **Revenue Tracking** and financial reporting

## 🏗️ Technical Architecture

### Backend (ASP.NET Core 8.0)
- **Framework**: ASP.NET Core Web API
- **Database**: SQLite (easily configurable for SQL Server/PostgreSQL)
- **Authentication**: JWT Bearer tokens with refresh token support
- **ORM**: Entity Framework Core with Code-First migrations
- **Real-time**: SignalR for instant messaging and notifications
- **Payments**: Stripe.NET for payment processing
- **Logging**: Serilog for structured logging
- **API Documentation**: Swagger/OpenAPI

### Frontend (Planned - React Native TypeScript)
- **Framework**: React Native with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **Navigation**: React Navigation
- **UI Components**: Native Base or React Native Elements
- **Real-time**: SignalR client for live updates

## 📁 Project Structure

```
FYLA2/
├── Controllers/           # API Controllers
│   ├── AuthController.cs         # Authentication endpoints
│   ├── ServiceProviderController.cs  # Provider management
│   ├── ServicesController.cs     # Service CRUD operations
│   ├── BookingsController.cs     # Booking management
│   ├── MessagingController.cs    # Chat functionality
│   ├── SocialController.cs       # Social media features
│   └── AnalyticsController.cs    # Business analytics
├── Models/               # Data Models
│   ├── User.cs                   # User entity (extends Identity)
│   ├── ServiceProvider.cs       # Service provider details
│   ├── Service.cs               # Individual services
│   ├── Booking.cs               # Booking records
│   ├── Message.cs               # Chat messages
│   ├── Post.cs                  # Social media posts
│   ├── Review.cs                # Reviews and ratings
│   └── Payment.cs               # Payment records
├── DTOs/                 # Data Transfer Objects
│   ├── Auth/                    # Authentication DTOs
│   ├── Booking/                 # Booking-related DTOs
│   ├── Service/                 # Service DTOs
│   ├── ServiceProvider/         # Provider DTOs
│   ├── Social/                  # Social media DTOs
│   ├── Messaging/               # Chat DTOs
│   └── Review/                  # Review DTOs
├── Data/                 # Database Context
│   └── ApplicationDbContext.cs  # EF Core DbContext
├── Services/             # Business Logic Services
│   └── TokenService.cs          # JWT token management
├── Hubs/                 # SignalR Hubs
│   └── ChatHub.cs               # Real-time chat hub
├── Mappings/             # AutoMapper Profiles
│   └── MappingProfile.cs        # Entity to DTO mappings
└── Migrations/           # EF Core Migrations
```

## 🚀 Getting Started

### Prerequisites
- .NET 8.0 SDK
- Visual Studio Code or Visual Studio
- SQLite (included with .NET)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FYLA2
   ```

2. **Restore packages**
   ```bash
   dotnet restore
   ```

3. **Update database**
   ```bash
   dotnet ef database update
   ```

4. **Run the application**
   ```bash
   dotnet run
   ```

5. **Access the API**
   - Swagger UI: `https://localhost:7000` (or configured port)
   - API Base URL: `https://localhost:7000/api`

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token

### Service Providers
- `POST /api/serviceprovider` - Create provider profile
- `GET /api/serviceprovider/{id}` - Get provider details
- `PUT /api/serviceprovider` - Update provider profile
- `GET /api/serviceprovider/search` - Search providers

### Services
- `POST /api/services` - Create a service
- `GET /api/services/{id}` - Get service details
- `PUT /api/services/{id}` - Update service
- `GET /api/services/search` - Search services

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}/status` - Update booking status
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/availability/{providerId}` - Check availability

### Messaging
- `POST /api/messaging/send` - Send message
- `GET /api/messaging/conversations` - Get conversations
- `GET /api/messaging/conversation/{userId}` - Get specific conversation
- `PUT /api/messaging/mark-read/{messageId}` - Mark message as read

### Social Features
- `POST /api/social/posts` - Create post
- `GET /api/social/posts` - Get posts feed
- `POST /api/social/posts/{id}/like` - Like/unlike post
- `POST /api/social/posts/{id}/comments` - Add comment
- `POST /api/social/follow/{userId}` - Follow user
- `GET /api/social/portfolio/{providerId}` - Get portfolio

### Analytics
- `GET /api/analytics/provider/dashboard` - Provider dashboard
- `GET /api/analytics/provider/revenue` - Revenue analytics
- `GET /api/analytics/provider/clients` - Client analytics

## 🔧 Configuration

### Database Connection
Update `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=fyla2.db"
  }
}
```

### JWT Configuration
```json
{
  "Jwt": {
    "Key": "your-secret-key-here",
    "Issuer": "FYLA2",
    "Audience": "FYLA2-Users"
  }
}
```

### Stripe Configuration
```json
{
  "Stripe": {
    "PublishableKey": "pk_test_your_key",
    "SecretKey": "sk_test_your_key",
    "WebhookSecret": "whsec_your_secret"
  }
}
```

## 🎯 Key Features Deep Dive

### 1. Booking System
- Real-time availability checking
- Automatic conflict detection
- Booking status management (Pending → Confirmed → In Progress → Completed)
- Cancellation handling with reasons

### 2. Real-time Messaging
- SignalR-powered instant messaging
- Read receipts and typing indicators
- Message history and search
- Booking-related conversations

### 3. Social Media Features
- Instagram-style posts with images/videos
- Like and comment system
- Follow/unfollow functionality
- Portfolio sharing for service providers

### 4. Payment Integration
- Stripe payment processing
- Platform fee calculation
- Revenue tracking and reporting
- Refund handling

### 5. Analytics Dashboard
- Revenue analytics with charts
- Client acquisition metrics
- Popular services tracking
- Geographic distribution analysis

## 🔐 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Authorization** (Client/Provider)
- **Input Validation** with FluentValidation
- **SQL Injection Protection** via Entity Framework
- **CORS Configuration** for API security
- **Rate Limiting** (configurable)

## 📱 Mobile App Integration

The API is designed to work seamlessly with a React Native mobile application:

- **RESTful API** design for mobile consumption
- **Real-time capabilities** via SignalR
- **Optimized endpoints** for mobile data usage
- **Image upload** support for posts and profiles
- **Push notification** ready architecture

## 🚀 Deployment

### Docker Support
The application can be containerized for easy deployment:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY . /app
WORKDIR /app
EXPOSE 80
ENTRYPOINT ["dotnet", "FYLA2.dll"]
```

### Cloud Deployment
Ready for deployment on:
- **Azure App Service**
- **AWS Elastic Beanstalk**
- **Google Cloud Run**
- **DigitalOcean App Platform**

## 🔮 Future Enhancements

- [ ] Push notifications
- [ ] Video calling integration
- [ ] AI-powered service recommendations
- [ ] Multi-language support
- [ ] Advanced scheduling with recurring appointments
- [ ] Loyalty programs and rewards
- [ ] Integration with calendar apps
- [ ] Advanced search with filters
- [ ] Geolocation services
- [ ] Photo editing tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**FYLA2** - Revolutionizing the beauty service industry with social connectivity! ✨
