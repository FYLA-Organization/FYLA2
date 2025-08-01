using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Data;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Services
{
  public class DataSeedingService
  {
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;

    public DataSeedingService(UserManager<User> userManager, ApplicationDbContext context)
    {
      _userManager = userManager;
      _context = context;
    }

    public async Task SeedDataAsync()
    {
      // Always ensure dev users exist, regardless of user count
      await EnsureDevUsersExist();

      // Check if data already exists for bulk seeding
      var userCount = await _context.Users.CountAsync();
      if (userCount > 2)
      {
        // Even if users exist, ensure we have sample bookings for analytics
        var existingBookings = await _context.Bookings.CountAsync();
        if (existingBookings == 0)
        {
          await SeedSampleBookingsAndPayments();
          await _context.SaveChangesAsync();
        }
        return; // Bulk data already seeded
      }

      // Seed Client Users
      var clientUsers = new List<User>();
      for (int i = 1; i <= 10; i++)
      {
        var user = new User
        {
          UserName = $"client{i}@fyla2.com",
          Email = $"client{i}@fyla2.com",
          FirstName = $"Client{i}",
          LastName = "User",
          DateOfBirth = DateTime.Now.AddYears(-25 - i),
          IsServiceProvider = false,
          Bio = $"I'm a beauty enthusiast looking for the best services. Client {i}",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, "Password123!");
        if (result.Succeeded)
        {
          clientUsers.Add(user);
        }
      }

      // Seed Service Provider Users
      var providerUsers = new List<User>();
      var specialties = new[] { "Hair Styling", "Makeup Artist", "Nail Technician", "Massage Therapist",
                                    "Skincare Specialist", "Eyebrow Artist", "Wedding Specialist", "Color Expert",
                                    "Bridal Makeup", "Men's Grooming" };

      for (int i = 1; i <= 10; i++)
      {
        var user = new User
        {
          UserName = $"provider{i}@fyla2.com",
          Email = $"provider{i}@fyla2.com",
          FirstName = $"Provider{i}",
          LastName = "Expert",
          DateOfBirth = DateTime.Now.AddYears(-30 - i),
          IsServiceProvider = true,
          Bio = $"Professional {specialties[i - 1]} with {i + 3} years of experience. Passionate about making clients look and feel amazing!",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, "Password123!");
        if (result.Succeeded)
        {
          providerUsers.Add(user);

          // Add services for each provider
          SeedServicesForProvider(user, specialties[i - 1], i);
        }
      }

      // Seed sample bookings and payments for analytics
      await SeedSampleBookingsAndPayments();

      await _context.SaveChangesAsync();
    }

    private async Task SeedSampleBookingsAndPayments()
    {
      // Get some users for sample data
      var clients = await _context.Users.Where(u => !u.IsServiceProvider).Take(5).ToListAsync();
      var providers = await _context.Users.Where(u => u.IsServiceProvider).Take(5).ToListAsync();
      var services = await _context.Services.Take(10).ToListAsync();

      if (!clients.Any() || !providers.Any() || !services.Any()) return;

      var random = new Random();
      var bookingsToAdd = new List<Booking>();
      var paymentsToAdd = new List<PaymentRecord>();

      // Create varied booking patterns for different clients
      for (int clientIndex = 0; clientIndex < clients.Count; clientIndex++)
      {
        var client = clients[clientIndex];

        // Create different client profiles:
        // Client 0: VIP (lots of bookings, high spending)
        // Client 1: Regular (moderate bookings)
        // Client 2: New (few recent bookings)
        // Client 3: Inactive (old bookings only)
        // Client 4: Occasional (sporadic bookings)

        int bookingCount = clientIndex switch
        {
          0 => 15, // VIP client
          1 => 8,  // Regular client
          2 => 3,  // New client
          3 => 5,  // Inactive client
          4 => 6,  // Occasional client
          _ => 4   // Default for any other clients
        };

        for (int i = 0; i < bookingCount; i++)
        {
          var service = services[random.Next(services.Count)];
          DateTime bookingDate;

          // Create different booking patterns based on client type
          if (clientIndex == 0) // VIP - consistent bookings over time
          {
            bookingDate = DateTime.UtcNow.AddDays(-random.Next(90));
          }
          else if (clientIndex == 2) // New client - recent bookings only
          {
            bookingDate = DateTime.UtcNow.AddDays(-random.Next(15));
          }
          else if (clientIndex == 3) // Inactive - old bookings only
          {
            bookingDate = DateTime.UtcNow.AddDays(-30 - random.Next(60));
          }
          else // Others - mixed pattern
          {
            bookingDate = DateTime.UtcNow.AddDays(-random.Next(45));
          }

          var startHour = 9 + random.Next(8);
          var isCompleted = random.Next(10) < 8; // 80% completion rate

          var booking = new Booking
          {
            ClientId = client.Id,
            ServiceId = service.Id,
            ProviderId = service.ProviderId,
            BookingDate = bookingDate.Date,
            StartTime = bookingDate.Date.AddHours(startHour),
            EndTime = bookingDate.Date.AddHours(startHour + 1),
            Status = isCompleted ? BookingStatus.Completed : BookingStatus.Cancelled,
            TotalPrice = service.Price,
            DurationMinutes = service.DurationMinutes,
            CreatedAt = bookingDate,
            CompletedAt = isCompleted ? bookingDate.AddHours(startHour + 1) : null,
            Notes = $"Booking for {client.FirstName} - {service.Name}"
          };

          bookingsToAdd.Add(booking);

          // Create corresponding payment record for completed bookings
          if (isCompleted)
          {
            var payment = new PaymentRecord
            {
              UserId = client.Id,
              BookingId = null, // Will be set after booking is saved
              Amount = service.Price,
              Currency = "usd",
              Status = PaymentStatus.Succeeded,
              Type = PaymentType.Booking,
              StripePaymentIntentId = $"pi_client_{clientIndex}_{Guid.NewGuid():N}",
              Description = $"Payment for {service.Name}",
              CreatedAt = bookingDate,
              UpdatedAt = bookingDate.AddMinutes(random.Next(5, 60))
            };

            paymentsToAdd.Add(payment);
          }
        }
      }

      // Add some additional recent bookings across all providers for better analytics
      for (int i = 0; i < 10; i++)
      {
        var client = clients[random.Next(clients.Count)];
        var service = services[random.Next(services.Count)];
        var bookingDate = DateTime.UtcNow.AddDays(-random.Next(7)); // Last week
        var startHour = 9 + random.Next(8);
        var isCompleted = random.Next(10) < 9; // 90% completion rate for recent bookings

        var booking = new Booking
        {
          ClientId = client.Id,
          ServiceId = service.Id,
          ProviderId = service.ProviderId,
          BookingDate = bookingDate.Date,
          StartTime = bookingDate.Date.AddHours(startHour),
          EndTime = bookingDate.Date.AddHours(startHour + 1),
          Status = isCompleted ? BookingStatus.Completed : BookingStatus.Confirmed,
          TotalPrice = service.Price,
          DurationMinutes = service.DurationMinutes,
          CreatedAt = bookingDate,
          CompletedAt = isCompleted ? bookingDate.AddHours(startHour + 1) : null,
          Notes = "Recent sample booking for analytics"
        };

        bookingsToAdd.Add(booking);

        // Create corresponding payment record for completed bookings
        if (isCompleted)
        {
          var payment = new PaymentRecord
          {
            UserId = client.Id,
            BookingId = null, // Will be set after booking is saved
            Amount = service.Price,
            Currency = "usd",
            Status = PaymentStatus.Succeeded,
            Type = PaymentType.Booking,
            StripePaymentIntentId = $"pi_recent_{Guid.NewGuid():N}",
            Description = $"Payment for {service.Name}",
            CreatedAt = bookingDate,
            UpdatedAt = bookingDate.AddMinutes(random.Next(5, 60))
          };

          paymentsToAdd.Add(payment);
        }
      }

      // Add all bookings first
      _context.Bookings.AddRange(bookingsToAdd);
      await _context.SaveChangesAsync();

      // Now link payments to bookings and add them
      var completedBookings = bookingsToAdd.Where(b => b.Status == BookingStatus.Completed).ToList();
      for (int i = 0; i < paymentsToAdd.Count && i < completedBookings.Count; i++)
      {
        paymentsToAdd[i].BookingId = completedBookings[i].Id;
      }

      _context.PaymentRecords.AddRange(paymentsToAdd);
    }

    private void SeedServicesForProvider(User provider, string specialty, int providerIndex)
    {
      var services = new List<Service>();

      switch (specialty)
      {
        case "Hair Styling":
          services.AddRange(new[]
          {
                        new Service { Name = "Haircut & Style", Description = "Professional haircut with styling", Price = 45 + (providerIndex * 5), DurationMinutes = 60, Category = "Hair", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Hair Coloring", Description = "Full hair color service", Price = 85 + (providerIndex * 10), DurationMinutes = 120, Category = "Hair", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Blowout", Description = "Professional blowout styling", Price = 35 + (providerIndex * 3), DurationMinutes = 45, Category = "Hair", ProviderId = provider.Id, IsActive = true }
                    });
          break;
        case "Makeup Artist":
          services.AddRange(new[]
          {
                        new Service { Name = "Full Face Makeup", Description = "Complete makeup application", Price = 60 + (providerIndex * 8), DurationMinutes = 60, Category = "Makeup", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Special Event Makeup", Description = "Makeup for special occasions", Price = 80 + (providerIndex * 10), DurationMinutes = 75, Category = "Makeup", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Makeup Lesson", Description = "Learn professional makeup techniques", Price = 90 + (providerIndex * 15), DurationMinutes = 90, Category = "Makeup", ProviderId = provider.Id, IsActive = true }
                    });
          break;
        case "Nail Technician":
          services.AddRange(new[]
          {
                        new Service { Name = "Manicure", Description = "Professional manicure service", Price = 25 + (providerIndex * 3), DurationMinutes = 45, Category = "Nails", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Pedicure", Description = "Relaxing pedicure service", Price = 35 + (providerIndex * 5), DurationMinutes = 60, Category = "Nails", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Gel Nails", Description = "Long-lasting gel nail application", Price = 40 + (providerIndex * 5), DurationMinutes = 75, Category = "Nails", ProviderId = provider.Id, IsActive = true }
                    });
          break;
        case "Massage Therapist":
          services.AddRange(new[]
          {
                        new Service { Name = "Relaxation Massage", Description = "Full body relaxation massage", Price = 70 + (providerIndex * 10), DurationMinutes = 60, Category = "Massage", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Deep Tissue Massage", Description = "Therapeutic deep tissue massage", Price = 85 + (providerIndex * 12), DurationMinutes = 90, Category = "Massage", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Hot Stone Massage", Description = "Relaxing hot stone therapy", Price = 95 + (providerIndex * 15), DurationMinutes = 90, Category = "Massage", ProviderId = provider.Id, IsActive = true }
                    });
          break;
        case "Skincare Specialist":
          services.AddRange(new[]
          {
                        new Service { Name = "Facial Treatment", Description = "Customized facial for your skin type", Price = 65 + (providerIndex * 8), DurationMinutes = 75, Category = "Skincare", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Chemical Peel", Description = "Professional chemical peel treatment", Price = 90 + (providerIndex * 12), DurationMinutes = 60, Category = "Skincare", ProviderId = provider.Id, IsActive = true },
                        new Service { Name = "Microdermabrasion", Description = "Skin resurfacing treatment", Price = 75 + (providerIndex * 10), DurationMinutes = 45, Category = "Skincare", ProviderId = provider.Id, IsActive = true }
                    });
          break;
        default:
          services.AddRange(new[]
          {
                        new Service { Name = $"{specialty} Service", Description = $"Professional {specialty.ToLower()} service", Price = 50 + (providerIndex * 5), DurationMinutes = 60, Category = specialty, ProviderId = provider.Id, IsActive = true },
                        new Service { Name = $"{specialty} Consultation", Description = $"{specialty} consultation and advice", Price = 30 + (providerIndex * 3), DurationMinutes = 30, Category = specialty, ProviderId = provider.Id, IsActive = true }
                    });
          break;
      }

      _context.Services.AddRange(services);
    }

    private async Task EnsureDevUsersExist()
    {
      // Ensure client1@fyla2.com exists
      var client = await _userManager.FindByEmailAsync("client1@fyla2.com");
      if (client == null)
      {
        client = new User
        {
          UserName = "client1@fyla2.com",
          Email = "client1@fyla2.com",
          FirstName = "Test",
          LastName = "Client",
          DateOfBirth = DateTime.Now.AddYears(-25),
          IsServiceProvider = false,
          Bio = "Test client for development",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        await _userManager.CreateAsync(client, "Password123!");
      }

      // Ensure provider1@fyla2.com exists
      var provider = await _userManager.FindByEmailAsync("provider1@fyla2.com");
      if (provider == null)
      {
        provider = new User
        {
          UserName = "provider1@fyla2.com",
          Email = "provider1@fyla2.com",
          FirstName = "Test",
          LastName = "Provider",
          DateOfBirth = DateTime.Now.AddYears(-30),
          IsServiceProvider = true,
          Bio = "Test provider for development",
          CreatedAt = DateTime.UtcNow,
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        await _userManager.CreateAsync(provider, "Password123!");
      }
    }
  }
}
