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
      if (await _context.Users.CountAsync() > 2)
      {
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
          await SeedServicesForProvider(user, specialties[i - 1], i);
        }
      }

      await _context.SaveChangesAsync();
    }

    private async Task SeedServicesForProvider(User provider, string specialty, int providerIndex)
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
