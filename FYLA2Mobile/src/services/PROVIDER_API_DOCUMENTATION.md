# Provider API Documentation & Implementation Guide

This document outlines all the API methods needed for transitioning from mock data to real backend integration for provider functionality.

## Implementation Status

Our provider management system is currently using fallback mock data. To transition to real data, these API methods need to be implemented in the backend and integrated into our `ApiService` class.

## Required API Endpoints

### Provider Profile Management

#### Get Current User Provider Profile
```typescript
// GET /api/providers/user/{userId}
async getCurrentUserProvider(): Promise<ServiceProvider | null>
```

#### Update Provider Profile
```typescript
// PUT /api/providers/profile
async updateProviderProfile(providerData: Partial<ServiceProvider>): Promise<ServiceProvider>
```

#### Create Provider Profile
```typescript
// POST /api/providers
async createProviderProfile(providerData: Omit<ServiceProvider, 'id'>): Promise<ServiceProvider>
```

### Service Management

#### Create Service
```typescript
// POST /api/services
async createService(serviceData: Omit<Service, 'id'>): Promise<Service>
```

#### Update Service
```typescript
// PUT /api/services/{serviceId}
async updateService(serviceId: string, serviceData: Partial<Service>): Promise<Service>
```

#### Delete Service
```typescript
// DELETE /api/services/{serviceId}
async deleteService(serviceId: string): Promise<void>
```

### Availability Management

#### Get Provider Availability
```typescript
// GET /api/providers/{providerId}/availability
async getProviderAvailability(providerId: string): Promise<ProviderAvailability>
```

#### Update Provider Availability
```typescript
// PUT /api/providers/availability
async updateProviderAvailability(availabilityData: ProviderAvailability): Promise<ProviderAvailability>
```

### Portfolio/Gallery Management

#### Upload Portfolio Image
```typescript
// POST /api/providers/portfolio/upload
async uploadPortfolioImage(imageFile: FormData): Promise<{ imageUrl: string }>
```

#### Delete Portfolio Image
```typescript
// DELETE /api/providers/portfolio/image
async deletePortfolioImage(imageUrl: string): Promise<void>
```

### Business Operations

#### Update Business Hours
```typescript
// PUT /api/providers/business-hours
async updateBusinessHours(businessHours: BusinessHours): Promise<BusinessHours>
```

#### Get Provider Schedule
```typescript
// GET /api/providers/{providerId}/schedule
async getProviderSchedule(providerId: string, date?: string): Promise<ProviderSchedule>
```

### Service Add-ons

#### Create Service Add-on
```typescript
// POST /api/services/{serviceId}/addons
async createServiceAddOn(serviceId: string, addOnData: ServiceAddOn): Promise<ServiceAddOn>
```

#### Update Service Add-on
```typescript
// PUT /api/services/{serviceId}/addons/{addOnId}
async updateServiceAddOn(serviceId: string, addOnId: string, addOnData: Partial<ServiceAddOn>): Promise<ServiceAddOn>
```

#### Delete Service Add-on
```typescript
// DELETE /api/services/{serviceId}/addons/{addOnId}
async deleteServiceAddOn(serviceId: string, addOnId: string): Promise<void>
```

### Provider Analytics

#### Get Provider Analytics
```typescript
// GET /api/providers/analytics
async getProviderAnalytics(period: 'week' | 'month' | 'year'): Promise<ProviderAnalytics>
```

### Reviews & Ratings

#### Get Provider Reviews
```typescript
// GET /api/providers/{providerId}/reviews
async getProviderReviews(providerId: string, page: number, limit: number): Promise<PaginatedReviews>
```

### Promotions & Marketing

#### Create Promotion
```typescript
// POST /api/providers/promotions
async createPromotion(promotionData: CreatePromotionRequest): Promise<Promotion>
```

#### Update Promotion
```typescript
// PUT /api/providers/promotions/{promotionId}
async updatePromotion(promotionId: string, promotionData: Partial<Promotion>): Promise<Promotion>
```

#### Delete Promotion
```typescript
// DELETE /api/providers/promotions/{promotionId}
async deletePromotion(promotionId: string): Promise<void>
```

## Implementation Priority

### Phase 1: Core Provider Features (Immediate)
- ✅ Provider profile management (storefront editing)
- ✅ Service management (create, edit, delete services)
- ✅ Availability management (schedule setting)
- 🔄 Image upload for portfolio and services

### Phase 2: Business Operations (Next)
- Booking management integration
- Payment processing
- Client communication

### Phase 3: Advanced Features (Future)
- Analytics dashboard
- Promotional tools
- Advanced scheduling features

## Current Screen Integration Status

### ProviderStorefrontScreen.tsx
- **Status**: Ready for API integration
- **Mock Data**: Using fallback provider data
- **API Needs**: 
  - `getCurrentUserProvider()`
  - `updateProviderProfile()`
  - `uploadPortfolioImage()`

### EnhancedServiceManagementScreen.tsx
- **Status**: Ready for API integration
- **Mock Data**: Using fallback services data
- **API Needs**:
  - `getProviderServices()`
  - `createService()`
  - `updateService()`
  - `deleteService()`
  - `uploadServiceImage()`

### ProviderAvailabilityScreen.tsx
- **Status**: Ready for API integration
- **Mock Data**: Using fallback availability data
- **API Needs**:
  - `getProviderAvailability()`
  - `updateProviderAvailability()`

## Backend Requirements

### Database Schema Updates Needed
- Provider profiles table
- Services table with provider relationship
- Availability schedules table
- Portfolio images table
- Service add-ons table

### File Upload Configuration
- Image storage (AWS S3, Cloudinary, etc.)
- Image processing (resizing, optimization)
- Security validation

### Authentication & Authorization
- Provider role verification
- Resource ownership validation
- API rate limiting

## Testing Strategy

### Unit Tests
- API service methods
- Data transformation functions
- Error handling scenarios

### Integration Tests
- API endpoint connectivity
- Data persistence verification
- Image upload functionality

### User Acceptance Tests
- Provider workflow completion
- Data synchronization accuracy
- Offline/online mode transitions

## Error Handling Strategy

### Network Errors
- Retry mechanisms with exponential backoff
- Offline mode with local storage
- User-friendly error messages

### Validation Errors
- Client-side validation before API calls
- Server validation error mapping
- Real-time form validation

### Data Synchronization
- Conflict resolution strategies
- Last-write-wins vs operational transforms
- Sync status indicators

## Performance Considerations

### Caching Strategy
- Provider data caching
- Image caching
- Availability data caching

### Optimizations
- Lazy loading of non-critical data
- Image compression and optimization
- API response compression

### Monitoring
- API response time tracking
- Error rate monitoring
- User experience metrics

## Security Considerations

### Data Protection
- Sensitive data encryption
- PII handling compliance
- Image content validation

### Access Control
- Provider resource isolation
- Admin vs provider permissions
- API key management

## Migration Plan

### Phase 1: Setup & Foundation
1. Backend API development
2. Database schema implementation
3. Basic authentication integration

### Phase 2: Core Features
1. Provider profile management
2. Service management
3. Basic availability setting

### Phase 3: Advanced Features
1. Image upload and processing
2. Analytics integration
3. Advanced scheduling features

### Phase 4: Production Deployment
1. Performance testing
2. Security auditing
3. User training and documentation

## Next Steps

1. **Backend Development**: Implement the API endpoints listed above
2. **API Integration**: Update ApiService with real endpoint calls
3. **Testing**: Comprehensive testing of all provider features
4. **User Training**: Documentation and tutorials for providers
5. **Performance Optimization**: Monitor and optimize based on usage patterns

---

*This documentation serves as the blueprint for transitioning our provider management system from mock data to full backend integration.*
