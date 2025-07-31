import { 
  ProviderClient, 
  Coupon, 
  LoyaltyProgram, 
  AutoMessage, 
  WeekSchedule, 
  DaySchedule, 
  BusinessLocation, 
  DashboardMetrics,
  ServicePerformance 
} from '../types';

// Demo Clients Data
export const demoClients: ProviderClient[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@email.com',
    phoneNumber: '+1 (555) 123-4567',
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    totalBookings: 15,
    totalSpent: 2250.00,
    averageRating: 4.8,
    lastVisit: '2024-01-15T10:00:00Z',
    loyaltyPoints: 450,
    notes: 'Prefers morning appointments. Allergic to certain skincare products.',
    preferences: ['Facial', 'Massage', 'Organic products'],
    tags: ['VIP', 'Regular'],
    createdAt: '2023-06-15T08:00:00Z'
  },
  {
    id: '2',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@email.com',
    phoneNumber: '+1 (555) 234-5678',
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/2.jpg',
    totalBookings: 8,
    totalSpent: 1100.00,
    averageRating: 4.9,
    lastVisit: '2024-01-20T14:30:00Z',
    loyaltyPoints: 220,
    notes: 'New client, very satisfied with services.',
    preferences: ['Manicure', 'Pedicure', 'Gel nails'],
    tags: ['New Client', 'Referral'],
    createdAt: '2023-11-10T12:00:00Z'
  },
  {
    id: '3',
    firstName: 'Jessica',
    lastName: 'Wilson',
    email: 'jessica.wilson@email.com',
    phoneNumber: '+1 (555) 345-6789',
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/3.jpg',
    totalBookings: 22,
    totalSpent: 3300.00,
    averageRating: 4.7,
    lastVisit: '2024-01-18T16:00:00Z',
    loyaltyPoints: 660,
    notes: 'Long-term client. Books monthly facials and quarterly massages.',
    preferences: ['Facial', 'Deep tissue massage', 'Anti-aging treatments'],
    tags: ['Loyal', 'High Value'],
    createdAt: '2023-03-20T09:00:00Z'
  },
  {
    id: '4',
    firstName: 'Amanda',
    lastName: 'Brown',
    email: 'amanda.brown@email.com',
    phoneNumber: '+1 (555) 456-7890',
    profilePictureUrl: 'https://randomuser.me/api/portraits/women/4.jpg',
    totalBookings: 5,
    totalSpent: 675.00,
    averageRating: 4.6,
    lastVisit: '2024-01-12T11:30:00Z',
    loyaltyPoints: 135,
    notes: 'Interested in package deals. Price conscious.',
    preferences: ['Basic facial', 'Swedish massage'],
    tags: ['Price Conscious'],
    createdAt: '2023-12-05T15:00:00Z'
  }
];

// Demo Coupons Data
export const demoCoupons: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME20',
    title: 'Welcome New Clients',
    description: '20% off your first service',
    discountType: 'percentage',
    discountValue: 20,
    minAmount: 50,
    maxDiscount: 50,
    usageLimit: 100,
    usageCount: 25,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-03-31T23:59:59Z',
    isActive: true,
    applicableServices: ['all'],
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'FACIAL15',
    title: 'Facial Special',
    description: '$15 off any facial service',
    discountType: 'fixed',
    discountValue: 15,
    minAmount: 75,
    usageLimit: 50,
    usageCount: 12,
    validFrom: '2024-01-15T00:00:00Z',
    validUntil: '2024-02-15T23:59:59Z',
    isActive: true,
    applicableServices: ['facial', 'deep-cleansing-facial'],
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    code: 'LOYALTY25',
    title: 'Loyalty Reward',
    description: '25% off for loyal customers',
    discountType: 'percentage',
    discountValue: 25,
    minAmount: 100,
    maxDiscount: 75,
    usageLimit: 20,
    usageCount: 8,
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2024-06-30T23:59:59Z',
    isActive: false,
    applicableServices: ['all'],
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Demo Loyalty Programs Data
export const demoLoyaltyPrograms: LoyaltyProgram[] = [
  {
    id: '1',
    name: 'Beauty Points Rewards',
    description: 'Earn points with every visit and redeem for discounts',
    pointsPerDollar: 2,
    redemptionRate: 100, // 100 points = $1 discount
    minimumRedemption: 500,
    bonusMultiplier: 1.5,
    tierThresholds: {
      bronze: 0,
      silver: 1000,
      gold: 2500,
      platinum: 5000
    },
    tierBenefits: {
      bronze: ['2 points per $1 spent'],
      silver: ['3 points per $1 spent', '5% birthday discount'],
      gold: ['4 points per $1 spent', '10% birthday discount', 'Priority booking'],
      platinum: ['5 points per $1 spent', '15% birthday discount', 'Priority booking', 'Complimentary add-ons']
    },
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z'
  }
];

// Demo Auto Messages Data
export const demoAutoMessages: AutoMessage[] = [
  {
    id: '1',
    name: 'Booking Confirmation',
    message: 'Hi {clientName}! Your appointment for {serviceName} on {date} at {time} is confirmed. See you soon! 💆‍♀️',
    trigger: 'booking_confirmed',
    delay: 0,
    isActive: true,
    lastSent: '2024-01-20T15:30:00Z',
    sentCount: 45,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Service Complete Thank You',
    message: 'Thank you for visiting us today, {clientName}! We hope you loved your {serviceName}. Please rate your experience and book your next appointment! ⭐',
    trigger: 'booking_completed',
    delay: 60,
    isActive: true,
    lastSent: '2024-01-20T17:45:00Z',
    sentCount: 38,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Birthday Special',
    message: 'Happy Birthday {clientName}! 🎉 Enjoy 20% off any service this month as our gift to you!',
    trigger: 'birthday',
    delay: 0,
    isActive: true,
    lastSent: '2024-01-18T09:00:00Z',
    sentCount: 6,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'We Miss You',
    message: 'Hi {clientName}, we miss you! It\'s been a while since your last visit. Book now and get 15% off your next service! 💕',
    trigger: 'no_visit_30_days',
    delay: 0,
    isActive: false,
    lastSent: '2024-01-10T10:00:00Z',
    sentCount: 12,
    createdAt: '2024-01-01T00:00:00Z'
  }
];

// Demo Week Schedule Data
export const generateDemoWeekSchedule = (weekOffset: number = 0): WeekSchedule => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
  
  const weekStart = startOfWeek.toISOString().split('T')[0];
  const weekEnd = new Date(startOfWeek);
  weekEnd.setDate(startOfWeek.getDate() + 6);
  
  const days: DaySchedule[] = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(startOfWeek);
    currentDate.setDate(startOfWeek.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const isWeekend = i === 0 || i === 6; // Sunday or Saturday
    
    const daySchedule: DaySchedule = {
      date: dateStr,
      isWorkingDay: !isWeekend,
      startTime: '09:00',
      endTime: '18:00',
      breakTimes: isWeekend ? [] : [
        { startTime: '12:00', endTime: '13:00' }
      ],
      blockedTimes: [],
      appointments: isWeekend ? [] : [
        {
          id: `${i}-1`,
          clientName: 'Sarah Johnson',
          serviceName: 'Deep Cleansing Facial',
          startTime: '10:00',
          endTime: '11:30',
          status: 'confirmed',
          clientId: '1',
          serviceId: '1'
        },
        {
          id: `${i}-2`,
          clientName: 'Emily Davis',
          serviceName: 'Manicure & Pedicure',
          startTime: '14:00',
          endTime: '15:30',
          status: 'confirmed',
          clientId: '2',
          serviceId: '2'
        }
      ]
    };
    
    // Add some variation for different days
    if (i === 1) { // Tuesday
      daySchedule.blockedTimes = [
        {
          id: 'block-1',
          startTime: '16:00',
          endTime: '17:00',
          reason: 'Personal appointment',
          createdAt: dateStr + 'T08:00:00Z'
        }
      ];
    }
    
    days.push(daySchedule);
  }
  
  return {
    weekStart,
    weekEnd: weekEnd.toISOString().split('T')[0],
    days
  };
};

// Demo Business Location Data
export const demoBusinessLocation: BusinessLocation = {
  id: '1',
  businessName: 'Serenity Beauty Spa',
  address: '123 Beauty Lane',
  city: 'Beverly Hills',
  state: 'CA',
  zipCode: '90210',
  coordinates: {
    latitude: 34.0736,
    longitude: -118.4004
  },
  contactPhone: '+1 (555) 123-BEAUTY',
  businessHours: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
    sunday: { isOpen: false, openTime: '10:00', closeTime: '16:00' }
  },
  amenities: [
    'Parking Available',
    'WiFi',
    'Refreshments',
    'Relaxation Area',
    'Private Rooms',
    'Wheelchair Accessible'
  ],
  description: 'A luxurious beauty spa offering premium skincare, nail care, and wellness services in the heart of Beverly Hills.',
  photos: [
    'https://images.unsplash.com/photo-1560750588-73207b1ef5b8',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881'
  ]
};

// Demo Dashboard Metrics Data
export const demoDashboardMetrics: DashboardMetrics = {
  todayRevenue: 850.00,
  weekRevenue: 4250.00,
  monthRevenue: 18500.00,
  totalClients: 245,
  newClientsThisMonth: 12,
  appointmentsToday: 8,
  appointmentsThisWeek: 32,
  averageRating: 4.8,
  topServices: [
    { name: 'Deep Cleansing Facial', revenue: 5200.00, bookings: 45 },
    { name: 'Full Body Massage', revenue: 4800.00, bookings: 32 },
    { name: 'Manicure & Pedicure', revenue: 3600.00, bookings: 48 },
    { name: 'Eyebrow Shaping', revenue: 2400.00, bookings: 60 }
  ],
  recentActivity: [
    {
      type: 'booking',
      message: 'New appointment booked by Sarah Johnson',
      timestamp: '2024-01-20T15:30:00Z'
    },
    {
      type: 'payment',
      message: 'Payment received for $150 from Emily Davis',
      timestamp: '2024-01-20T14:45:00Z'
    },
    {
      type: 'review',
      message: 'Jessica Wilson left a 5-star review',
      timestamp: '2024-01-20T13:20:00Z'
    },
    {
      type: 'new_client',
      message: 'New client registered: Amanda Brown',
      timestamp: '2024-01-20T12:15:00Z'
    }
  ]
};

// Demo Service Performance Data
export const demoServicePerformance: ServicePerformance[] = [
  {
    serviceId: '1',
    serviceName: 'Deep Cleansing Facial',
    bookings: 45,
    revenue: 5200.00,
    averageRating: 4.9,
    completionRate: 98.2,
    averageDuration: 90,
    popularTimes: ['10:00', '14:00', '16:00'],
    clientSatisfaction: 4.8
  },
  {
    serviceId: '2',
    serviceName: 'Full Body Massage',
    bookings: 32,
    revenue: 4800.00,
    averageRating: 4.7,
    completionRate: 96.8,
    averageDuration: 120,
    popularTimes: ['11:00', '15:00', '17:00'],
    clientSatisfaction: 4.6
  },
  {
    serviceId: '3',
    serviceName: 'Manicure & Pedicure',
    bookings: 48,
    revenue: 3600.00,
    averageRating: 4.8,
    completionRate: 99.1,
    averageDuration: 75,
    popularTimes: ['13:00', '15:30', '17:30'],
    clientSatisfaction: 4.7
  },
  {
    serviceId: '4',
    serviceName: 'Eyebrow Shaping',
    bookings: 60,
    revenue: 2400.00,
    averageRating: 4.6,
    completionRate: 97.5,
    averageDuration: 30,
    popularTimes: ['12:00', '16:00', '18:00'],
    clientSatisfaction: 4.5
  }
];

// Helper function to generate realistic revenue data
export const generateRevenueAnalytics = (timeframe: 'week' | 'month' | 'quarter' | 'year') => {
  const baseRevenue = {
    week: 4250,
    month: 18500,
    quarter: 52000,
    year: 220000
  };

  const periods = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365
  };

  const revenueByPeriod = [];
  const totalRevenue = baseRevenue[timeframe];
  const periodCount = periods[timeframe];
  
  for (let i = 0; i < (timeframe === 'week' ? 7 : timeframe === 'month' ? 4 : timeframe === 'quarter' ? 3 : 12); i++) {
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120% of base
    const amount = (totalRevenue / (timeframe === 'week' ? 7 : timeframe === 'month' ? 4 : timeframe === 'quarter' ? 3 : 12)) * variance;
    
    revenueByPeriod.push({
      period: timeframe === 'week' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] :
              timeframe === 'month' ? `Week ${i + 1}` :
              timeframe === 'quarter' ? ['Month 1', 'Month 2', 'Month 3'][i] :
              ['Q1', 'Q2', 'Q3', 'Q4'][i],
      amount: Math.round(amount * 100) / 100
    });
  }

  return {
    totalRevenue,
    revenueChange: 12.5 + Math.random() * 10, // 12.5% to 22.5% growth
    revenueByPeriod,
    topServices: demoServicePerformance.slice(0, 4).map(service => ({
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      revenue: service.revenue,
      bookings: service.bookings
    })),
    averageOrderValue: totalRevenue / demoServicePerformance.reduce((sum, s) => sum + s.bookings, 0),
    revenueGoal: totalRevenue * 1.2,
    revenueProgress: (totalRevenue / (totalRevenue * 1.2)) * 100
  };
};

// Helper function to generate client analytics
export const generateClientAnalytics = () => {
  return {
    totalClients: 245,
    newClients: 12,
    clientRetentionRate: 87.5,
    averageClientValue: 156.25,
    clientsByTier: [
      { tier: 'Bronze', count: 120 },
      { tier: 'Silver', count: 85 },
      { tier: 'Gold', count: 32 },
      { tier: 'Platinum', count: 8 }
    ],
    topClients: demoClients.slice(0, 3).map(client => ({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      totalSpent: client.totalSpent,
      visits: client.totalBookings
    })),
    clientGrowthTrend: [
      { period: 'Week 1', newClients: 3, retainedClients: 58 },
      { period: 'Week 2', newClients: 4, retainedClients: 62 },
      { period: 'Week 3', newClients: 2, retainedClients: 59 },
      { period: 'Week 4', newClients: 3, retainedClients: 61 }
    ]
  };
};
