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
    private readonly Random _random = new Random();

    public DataSeedingService(UserManager<User> userManager, ApplicationDbContext context)
    {
      _userManager = userManager;
      _context = context;
    }

    public async Task SeedDataAsync()
    {
      // Check if comprehensive data already exists
      var userCount = await _context.Users.CountAsync();
      var serviceCount = await _context.Services.CountAsync();
      var bookingCount = await _context.Bookings.CountAsync();
      var reviewCount = await _context.Reviews.CountAsync();
      var scheduleCount = await _context.ProviderSchedules.CountAsync();
      
      // If we have users, services, bookings, reviews, and schedules, everything is complete
      if (userCount >= 90 && serviceCount > 0 && bookingCount > 0 && reviewCount > 0 && scheduleCount > 0)
      {
        return; // Comprehensive data already seeded
      }

      // If we have users but missing some data, complete the seeding
      if (userCount >= 90)
      {
        var existingClients = await _context.Users.Where(u => !u.IsServiceProvider).ToListAsync();
        var existingProviders = await _context.Users.Where(u => u.IsServiceProvider).ToListAsync();
        
        // Ensure ServiceProvider entities exist for all provider users
        foreach (var provider in existingProviders)
        {
          var existingServiceProvider = await _context.ServiceProviders.FirstOrDefaultAsync(sp => sp.UserId == provider.Id);
          if (existingServiceProvider == null)
          {
            var serviceProvider = new Models.ServiceProvider
            {
              UserId = provider.Id,
              BusinessName = $"{provider.FirstName} {provider.LastName}",
              BusinessDescription = provider.Bio ?? "Professional beauty services",
              BusinessAddress = $"{_random.Next(100, 9999)} Main St, City",
              IsVerified = _random.Next(1, 101) <= 70, // 70% verified
              CreatedAt = provider.CreatedAt,
              UpdatedAt = DateTime.UtcNow
            };
            
            _context.ServiceProviders.Add(serviceProvider);
          }
        }
        
        await _context.SaveChangesAsync(); // Save ServiceProvider entities first
        
        // Seed missing data
        if (serviceCount == 0)
        {
          await SeedServices(existingProviders);
        }
        
        if (scheduleCount == 0)
        {
          await SeedSchedules(existingProviders);
        }
        
        if (reviewCount == 0)
        {
          await SeedReviews(existingProviders, existingClients);
        }
        
        // Always update posts to ensure providers have 10+ posts
        await SeedPosts(existingProviders, existingClients);
        
        // Only seed comments and likes if they don't exist yet
        var existingLikesCount = await _context.PostLikes.CountAsync();
        var existingCommentsCount = await _context.Comments.CountAsync();
        
        if (existingCommentsCount == 0)
        {
          await SeedComments(existingProviders, existingClients);
        }
        
        if (existingLikesCount == 0)
        {
          await SeedLikes(existingProviders, existingClients);
        }
        
        if (bookingCount == 0)
        {
          await SeedBookings(existingProviders, existingClients);
        }
        
        await _context.SaveChangesAsync();
        return;
      }

      // Clear existing data for fresh comprehensive seeding
      await ClearExistingData();

      // Seed comprehensive data
      var clients = await SeedClients(50);
      var providers = await SeedProviders(40);
      
      await SeedServices(providers);
      await SeedSchedules(providers);
      await SeedPosts(providers, clients);
      await SeedReviews(providers, clients);
      await SeedComments(providers, clients);
      await SeedLikes(providers, clients);
      await SeedFollows(providers, clients);
      await SeedBookings(providers, clients);
      await SeedMessages(providers, clients);
      await SeedNotifications(providers, clients);
      
      await _context.SaveChangesAsync();
    }

    private async Task ClearExistingData()
    {
      // Clear all data to start fresh
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM ProviderSchedules");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Reviews");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Comments");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM PostLikes");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM UserFollows");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Messages");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Notifications");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Bookings");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Posts");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM Services");
      await _context.Database.ExecuteSqlRawAsync("DELETE FROM ServiceProviders");
      
      // Clear users
      var users = await _context.Users.ToListAsync();
      foreach (var user in users)
      {
        await _userManager.DeleteAsync(user);
      }
    }

    private async Task<List<User>> SeedClients(int count)
    {
      var clients = new List<User>();
      var firstNames = new[] { "Emma", "Olivia", "Ava", "Isabella", "Sophia", "Charlotte", "Mia", "Amelia", "Harper", "Evelyn", 
                              "Abigail", "Emily", "Elizabeth", "Mila", "Ella", "Avery", "Sofia", "Camila", "Aria", "Scarlett",
                              "Victoria", "Madison", "Luna", "Grace", "Chloe", "Penelope", "Layla", "Riley", "Zoey", "Nora",
                              "Lily", "Eleanor", "Hannah", "Lillian", "Addison", "Aubrey", "Ellie", "Stella", "Natalie", "Zoe",
                              "Leah", "Hazel", "Violet", "Aurora", "Savannah", "Audrey", "Brooklyn", "Bella", "Claire", "Skylar" };
      
      var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                             "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                             "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
                             "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
                             "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts" };

      for (int i = 1; i <= count; i++)
      {
        var firstName = firstNames[_random.Next(firstNames.Length)];
        var lastName = lastNames[_random.Next(lastNames.Length)];
        
        var user = new User
        {
          UserName = $"client{i}@fyla2.com",
          Email = $"client{i}@fyla2.com",
          FirstName = firstName,
          LastName = lastName,
          DateOfBirth = DateTime.Now.AddYears(-_random.Next(18, 65)),
          IsServiceProvider = false,
          Bio = GenerateClientBio(firstName, i),
          ProfilePictureUrl = $"https://randomuser.me/api/portraits/women/{_random.Next(1, 100)}.jpg",
          CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 365)),
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, "Password123!");
        if (result.Succeeded)
        {
          clients.Add(user);
        }
      }

      return clients;
    }

    private async Task<List<User>> SeedProviders(int count)
    {
      var providers = new List<User>();
      var businessNames = new[] {
        "Glamour Studio", "Elite Beauty", "Luxe Salon", "Radiant Spa", "Divine Looks", "Prestige Beauty", "Elegant Touch", "Bella Vista",
        "Golden Glow", "Crystal Clear", "Serenity Spa", "Chic Studio", "Vibrant Beauty", "Pure Bliss", "Enchanted Salon", "Timeless Beauty",
        "Royal Treatment", "Zen Beauty", "Paradise Spa", "Stunning Styles", "Graceful Beauty", "Majestic Salon", "Harmony Spa", "Brilliant Beauty",
        "Sophisticated Styles", "Exquisite Touch", "Heavenly Beauty", "Opulent Salon", "Refined Beauty", "Magnificent Looks", "Sublime Spa",
        "Captivating Beauty", "Flawless Finish", "Dreamy Designs", "Luxurious Looks", "Ethereal Beauty", "Spectacular Salon", "Gorgeous Glow",
        "Dazzling Beauty", "Perfect Polish"
      };

      var specialties = new[] { "Hair Styling", "Makeup Artist", "Nail Technician", "Massage Therapist", "Skincare Specialist", 
                               "Eyebrow Artist", "Wedding Specialist", "Color Expert", "Bridal Makeup", "Men's Grooming" };

      var cities = new[] {
        "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", 
        "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL",
        "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "San Francisco, CA", "Indianapolis, IN", "Seattle, WA",
        "Denver, CO", "Washington, DC", "Boston, MA", "El Paso, TX", "Detroit, MI", "Nashville, TN", "Portland, OR",
        "Memphis, TN", "Oklahoma City, OK", "Las Vegas, NV", "Louisville, KY", "Baltimore, MD", "Milwaukee, WI",
        "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Mesa, AZ", "Kansas City, MO", "Atlanta, GA",
        "Long Beach, CA", "Colorado Springs, CO", "Raleigh, NC", "Miami, FL", "Virginia Beach, VA", "Omaha, NE",
        "Oakland, CA", "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA"
      };

      for (int i = 1; i <= count; i++)
      {
        var businessName = businessNames[_random.Next(businessNames.Length)];
        var specialty = specialties[_random.Next(specialties.Length)];
        
        var user = new User
        {
          UserName = $"provider{i}@fyla2.com",
          Email = $"provider{i}@fyla2.com",
          FirstName = businessName.Split(' ')[0],
          LastName = "Professional",
          DateOfBirth = DateTime.Now.AddYears(-_random.Next(25, 55)),
          IsServiceProvider = true,
          Bio = GenerateProviderBio(businessName, specialty, _random.Next(1, 15)),
          ProfilePictureUrl = $"https://randomuser.me/api/portraits/women/{_random.Next(1, 100)}.jpg",
          CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(30, 730)),
          UpdatedAt = DateTime.UtcNow,
          EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, "Password123!");
        if (result.Succeeded)
        {
          providers.Add(user);
          
          // Create ServiceProvider entity
          var serviceProvider = new Models.ServiceProvider
          {
            UserId = user.Id,
            BusinessName = businessName,
            BusinessDescription = user.Bio,
            BusinessAddress = cities[_random.Next(cities.Length)],
            IsVerified = _random.Next(1, 101) <= 70, // 70% verified
            CreatedAt = user.CreatedAt,
            UpdatedAt = DateTime.UtcNow
          };
          
          _context.ServiceProviders.Add(serviceProvider);
        }
      }

      return providers;
    }

    private async Task SeedServices(List<User> providers)
    {
      var serviceTemplates = new Dictionary<string, List<(string name, string desc, int minPrice, int maxPrice, int duration)>>
      {
        ["Hair Styling"] = new()
        {
          ("Haircut & Style", "Professional haircut with styling", 45, 85, 60),
          ("Hair Coloring", "Full hair color service", 85, 150, 120),
          ("Highlights", "Partial or full highlights", 95, 180, 150),
          ("Blowout", "Professional blowout styling", 35, 65, 45),
          ("Keratin Treatment", "Smoothing keratin treatment", 150, 300, 180)
        },
        ["Makeup Artist"] = new()
        {
          ("Full Face Makeup", "Complete makeup application", 60, 120, 60),
          ("Special Event Makeup", "Makeup for special occasions", 80, 160, 75),
          ("Bridal Makeup", "Wedding day makeup", 150, 300, 90),
          ("Makeup Lesson", "Learn professional techniques", 90, 180, 90),
          ("Airbrush Makeup", "Flawless airbrush application", 100, 200, 75)
        },
        ["Nail Technician"] = new()
        {
          ("Manicure", "Professional manicure service", 25, 50, 45),
          ("Pedicure", "Relaxing pedicure service", 35, 70, 60),
          ("Gel Nails", "Long-lasting gel application", 40, 80, 75),
          ("Nail Art", "Custom nail art design", 50, 100, 90),
          ("Acrylic Nails", "Full set acrylic nails", 55, 110, 120)
        },
        ["Massage Therapist"] = new()
        {
          ("Relaxation Massage", "Full body relaxation", 70, 140, 60),
          ("Deep Tissue Massage", "Therapeutic deep tissue", 85, 170, 90),
          ("Hot Stone Massage", "Relaxing hot stone therapy", 95, 190, 90),
          ("Swedish Massage", "Classic Swedish massage", 75, 150, 75),
          ("Sports Massage", "Athletic recovery massage", 90, 180, 75)
        },
        ["Skincare Specialist"] = new()
        {
          ("Facial Treatment", "Customized facial", 65, 130, 75),
          ("Chemical Peel", "Professional peel treatment", 90, 180, 60),
          ("Microdermabrasion", "Skin resurfacing", 75, 150, 45),
          ("Anti-Aging Treatment", "Advanced anti-aging", 120, 240, 90),
          ("Acne Treatment", "Specialized acne care", 85, 170, 60)
        }
      };

      foreach (var provider in providers)
      {
        var serviceProvider = await _context.ServiceProviders.FirstOrDefaultAsync(sp => sp.UserId == provider.Id);
        if (serviceProvider != null)
        {
          // Get a random specialty from our available templates
          var availableSpecialties = serviceTemplates.Keys.ToArray();
          var specialty = availableSpecialties[_random.Next(availableSpecialties.Length)];
          
          var templates = serviceTemplates[specialty];
          var numServices = _random.Next(2, Math.Min(6, templates.Count + 1));
          var selectedTemplates = templates.OrderBy(x => _random.Next()).Take(numServices);

          foreach (var template in selectedTemplates)
          {
            var service = new Service
            {
              Name = template.name,
              Description = template.desc,
              Price = (decimal)_random.Next(template.minPrice, template.maxPrice + 1),
              DurationMinutes = template.duration,
              Category = specialty,
              ProviderId = provider.Id,
              IsActive = true,
              CreatedAt = DateTime.UtcNow,
              UpdatedAt = DateTime.UtcNow
            };

            _context.Services.Add(service);
          }
        }
      }
    }

    private async Task SeedPosts(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      var postTemplates = new[]
      {
        "Just finished this amazing transformation! ✨ #beauty #transformation",
        "Loving this new look! What do you think? 💄 #makeup #style",
        "Fresh highlights and feeling fabulous! 🌟 #hair #highlights", 
        "Self-care Sunday vibes 🧘‍♀️ #selfcare #wellness",
        "New nail art design! Obsessed! 💅 #nails #nailart",
        "Before and after magic! ✨ #beforeandafter #makeover",
        "Perfect for date night! 💕 #datenight #glam",
        "Bridal trial complete! Can't wait for the big day! 👰 #bridal #wedding",
        "Feeling confident and beautiful! 💪 #confidence #beauty",
        "Thank you to my amazing stylist! 🙏 #grateful #teamwork",
        "New technique learned today! 📚 #education #skills",
        "Client appreciation post! 💕 #clients #thankful",
        "Behind the scenes magic! ✨ #behindthescenes #work",
        "Color correction perfection! 🎨 #colorcorrection #expertise",
        "Special occasion glam! 🌟 #special #glamour",
        "Natural beauty enhanced! 🌿 #natural #enhancement",
        "Texture and volume goals! 💫 #texture #volume",
        "Precision and artistry! 🎯 #precision #art",
        "Client transformation story! 📖 #transformation #story",
        "Professional development day! 🏆 #professional #growth"
      };

      var imageUrls = new[]
      {
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop"
      };

      // Check existing post counts for each user
      var existingPostCounts = await _context.Posts
        .GroupBy(p => p.UserId)
        .Select(g => new { UserId = g.Key, Count = g.Count() })
        .ToListAsync();

      var existingPostCountsDict = existingPostCounts.ToDictionary(x => x.UserId, x => x.Count);

      foreach (var user in allUsers)
      {
        var existingPosts = existingPostCountsDict.GetValueOrDefault(user.Id, 0);
        var targetPosts = user.IsServiceProvider ? 15 : 5; // Target 15 posts for providers, 5 for clients
        var postsToCreate = Math.Max(0, targetPosts - existingPosts);

        for (int i = 0; i < postsToCreate; i++)
        {
          var post = new Post
          {
            UserId = user.Id,
            Content = postTemplates[_random.Next(postTemplates.Length)],
            ImageUrl = imageUrls[_random.Next(imageUrls.Length)],
            IsBusinessPost = user.IsServiceProvider && _random.Next(1, 101) <= 70, // 70% business posts for providers
            CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 90)),
            UpdatedAt = DateTime.UtcNow
          };

          _context.Posts.Add(post);
        }
      }
    }

    private async Task SeedComments(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      var posts = await _context.Posts.ToListAsync();
      
      // Get existing comments to avoid over-commenting
      var existingCommentCounts = await _context.Comments
        .GroupBy(c => c.PostId)
        .Select(g => new { PostId = g.Key, Count = g.Count() })
        .ToListAsync();
      var existingCommentCountsDict = existingCommentCounts.ToDictionary(x => x.PostId, x => x.Count);
      
      var commentTemplates = new[]
      {
        "Absolutely gorgeous! 😍",
        "Love this look! Where did you get it done?",
        "You look amazing! ✨",
        "So beautiful! Can I book an appointment?",
        "Incredible work! 🙌",
        "This is exactly what I want!",
        "Stunning transformation! 💫",
        "Goals! 💕",
        "Perfect! How much does this cost?",
        "Amazing skills! 👏",
        "Beautiful work! 🌟",
        "Love the colors! 🎨",
        "Can you do this for me too?",
        "Wow! This is incredible! 🤩",
        "Professional work! ⭐"
      };

      foreach (var post in posts)
      {
        var existingComments = existingCommentCountsDict.GetValueOrDefault(post.Id, 0);
        var targetComments = _random.Next(3, 8); // Target 3-7 comments per post
        var commentsToCreate = Math.Max(0, targetComments - existingComments);
        
        for (int i = 0; i < commentsToCreate; i++)
        {
          var commenter = allUsers[_random.Next(allUsers.Count)];
          if (commenter.Id != post.UserId) // Don't comment on own posts
          {
            var comment = new Comment
            {
              PostId = post.Id,
              UserId = commenter.Id,
              Content = commentTemplates[_random.Next(commentTemplates.Length)],
              CreatedAt = post.CreatedAt.AddMinutes(_random.Next(1, 1440)) // Within 24 hours of post
            };

            _context.Comments.Add(comment);
          }
        }
      }
    }

    private async Task SeedLikes(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      var posts = await _context.Posts.ToListAsync();
      
      // Get existing likes to avoid duplicates
      var existingLikes = await _context.PostLikes
        .Select(pl => new { pl.PostId, pl.UserId })
        .ToListAsync();
      var existingLikesSet = new HashSet<(int PostId, string UserId)>(
        existingLikes.Select(el => (el.PostId, el.UserId))
      );

      foreach (var post in posts)
      {
        var numLikes = _random.Next(0, Math.Min(15, allUsers.Count)); // 0-15 likes per post
        var likers = allUsers.OrderBy(x => _random.Next()).Take(numLikes).Where(u => u.Id != post.UserId);

        foreach (var liker in likers)
        {
          // Check if this like already exists
          if (!existingLikesSet.Contains((post.Id, liker.Id)))
          {
            var like = new PostLike
            {
              PostId = post.Id,
              UserId = liker.Id,
              CreatedAt = post.CreatedAt.AddMinutes(_random.Next(1, 1440))
            };

            _context.PostLikes.Add(like);
            existingLikesSet.Add((post.Id, liker.Id)); // Add to set to avoid duplicates in this session
          }
        }
      }
    }

    private async Task SeedFollows(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      
      // Get existing follows to avoid duplicates
      var existingFollows = await _context.UserFollows
        .Select(uf => new { uf.FollowerId, uf.FollowingId })
        .ToListAsync();
      var existingFollowsSet = new HashSet<(string FollowerId, string FollowingId)>(
        existingFollows.Select(ef => (ef.FollowerId, ef.FollowingId))
      );

      foreach (var user in allUsers)
      {
        var numFollows = _random.Next(5, 25); // Each user follows 5-25 others
        var followees = allUsers.Where(u => u.Id != user.Id).OrderBy(x => _random.Next()).Take(numFollows);

        foreach (var followee in followees)
        {
          // Check if this follow relationship already exists
          if (!existingFollowsSet.Contains((user.Id, followee.Id)))
          {
            var follow = new UserFollow
            {
              FollowerId = user.Id,
              FollowingId = followee.Id,
              CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 180))
            };

            _context.UserFollows.Add(follow);
            existingFollowsSet.Add((user.Id, followee.Id)); // Add to set to avoid duplicates in this session
          }
        }
      }
    }

    private async Task SeedBookings(List<User> providers, List<User> clients)
    {
      var services = await _context.Services.ToListAsync();
      
      if (!services.Any())
      {
        return; // No services available for booking
      }

      foreach (var client in clients)
      {
        var numBookings = _random.Next(1, 6); // 1-5 bookings per client
        var selectedServices = services.OrderBy(x => _random.Next()).Take(numBookings);

        foreach (var service in selectedServices)
        {
          var bookingDate = DateTime.UtcNow.AddDays(_random.Next(-60, 30)); // Past 60 days to future 30 days
          var startTime = bookingDate.Date.AddHours(_random.Next(9, 18)); // 9 AM to 6 PM
          var endTime = startTime.AddMinutes(service.DurationMinutes);
          
          var status = bookingDate < DateTime.UtcNow ? 
            (_random.Next(1, 101) <= 80 ? BookingStatus.Completed : BookingStatus.Cancelled) :
            (_random.Next(1, 101) <= 90 ? BookingStatus.Confirmed : BookingStatus.Pending);

          var booking = new Booking
          {
            ClientId = client.Id,
            ServiceId = service.Id,
            ProviderId = service.ProviderId,
            BookingDate = bookingDate,
            StartTime = startTime,
            EndTime = endTime,
            DurationMinutes = service.DurationMinutes,
            Status = status,
            TotalPrice = service.Price,
            Notes = "Looking forward to this appointment!",
            CreatedAt = bookingDate.AddDays(-_random.Next(1, 7)),
            UpdatedAt = DateTime.UtcNow
          };

          _context.Bookings.Add(booking);
        }
      }
    }

    private Task SeedMessages(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      var messageTemplates = new[]
      {
        "Hi! I'd like to book an appointment.",
        "What times do you have available this week?",
        "Thank you for the amazing service!",
        "Can you do this style for me?",
        "I love the work you did! When can I come back?",
        "Do you have any openings tomorrow?",
        "Perfect! See you then!",
        "Thanks for fitting me in!",
        "Amazing work as always! 💕",
        "Can we reschedule for next week?"
      };

      // Create conversations between clients and providers
      foreach (var client in clients)
      {
        var numConversations = _random.Next(1, 4); // 1-3 conversations per client
        var conversationPartners = providers.OrderBy(x => _random.Next()).Take(numConversations);

        foreach (var provider in conversationPartners)
        {
          var numMessages = _random.Next(2, 8); // 2-7 messages per conversation
          for (int i = 0; i < numMessages; i++)
          {
            var isFromClient = i % 2 == 0; // Alternate between client and provider
            var senderId = isFromClient ? client.Id : provider.Id;
            var receiverId = isFromClient ? provider.Id : client.Id;

            var message = new Message
            {
              SenderId = senderId,
              ReceiverId = receiverId,
              Content = messageTemplates[_random.Next(messageTemplates.Length)],
              CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 30)).AddMinutes(i * 5),
              IsRead = _random.Next(1, 101) <= 80 // 80% read
            };

            _context.Messages.Add(message);
          }
        }
      }
      
      return Task.CompletedTask;
    }

    private Task SeedNotifications(List<User> providers, List<User> clients)
    {
      var allUsers = providers.Concat(clients).ToList();
      var notificationTypes = new[]
      {
        "New booking request",
        "Booking confirmed",
        "New message received",
        "New follower",
        "Post liked",
        "New comment on your post",
        "Booking reminder",
        "Payment received"
      };

      foreach (var user in allUsers)
      {
        var numNotifications = _random.Next(3, 12); // 3-11 notifications per user
        for (int i = 0; i < numNotifications; i++)
        {
          var notification = new Notification
          {
            UserId = user.Id,
            Title = notificationTypes[_random.Next(notificationTypes.Length)],
            Message = "You have a new notification. Tap to view details.",
            IsRead = _random.Next(1, 101) <= 60, // 60% read
            CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 14))
          };

          _context.Notifications.Add(notification);
        }
      }
      
      return Task.CompletedTask;
    }

    private string GenerateClientBio(string firstName, int index)
    {
      var bios = new[]
      {
        $"Beauty enthusiast who loves trying new looks! Always searching for the perfect style. 💄",
        $"Self-care Sunday is my favorite day! Love pampering myself and looking fabulous. ✨",
        $"Professional who believes looking good helps me feel confident. Quality services only! 💼",
        $"Mother of two who deserves some me-time. Beauty treatments are my escape! 👩‍👧‍👦",
        $"Fashion lover and beauty addict. Always up for trying the latest trends! 👗",
        $"Wellness advocate who believes inner and outer beauty go hand in hand. 🧘‍♀️",
        $"Busy professional who values efficient, high-quality beauty services. ⏰",
        $"Special events require special looks! I love getting glammed up! 🎉"
      };
      
      return bios[index % bios.Length];
    }

    private string GenerateProviderBio(string businessName, string specialty, int experience)
    {
      return $"Welcome to {businessName}! Professional {specialty} with {experience} years of experience. " +
             $"Passionate about making every client look and feel their absolute best. " +
             $"Specializing in the latest techniques and trends. Book your appointment today! ✨";
    }

    private Task SeedSchedules(List<User> providers)
    {
      var scheduleTemplates = new[]
      {
        // Standard business hours
        new { Days = new[] { DayOfWeekEnum.Monday, DayOfWeekEnum.Tuesday, DayOfWeekEnum.Wednesday, DayOfWeekEnum.Thursday, DayOfWeekEnum.Friday }, Start = new TimeSpan(9, 0, 0), End = new TimeSpan(17, 0, 0) },
        // Extended hours
        new { Days = new[] { DayOfWeekEnum.Monday, DayOfWeekEnum.Tuesday, DayOfWeekEnum.Wednesday, DayOfWeekEnum.Thursday, DayOfWeekEnum.Friday, DayOfWeekEnum.Saturday }, Start = new TimeSpan(8, 0, 0), End = new TimeSpan(19, 0, 0) },
        // Weekend focused
        new { Days = new[] { DayOfWeekEnum.Thursday, DayOfWeekEnum.Friday, DayOfWeekEnum.Saturday, DayOfWeekEnum.Sunday }, Start = new TimeSpan(10, 0, 0), End = new TimeSpan(18, 0, 0) },
        // Part-time
        new { Days = new[] { DayOfWeekEnum.Tuesday, DayOfWeekEnum.Thursday, DayOfWeekEnum.Saturday }, Start = new TimeSpan(12, 0, 0), End = new TimeSpan(20, 0, 0) },
        // Full week
        new { Days = new[] { DayOfWeekEnum.Monday, DayOfWeekEnum.Tuesday, DayOfWeekEnum.Wednesday, DayOfWeekEnum.Thursday, DayOfWeekEnum.Friday, DayOfWeekEnum.Saturday, DayOfWeekEnum.Sunday }, Start = new TimeSpan(9, 0, 0), End = new TimeSpan(18, 0, 0) },
      };

      foreach (var provider in providers)
      {
        var template = scheduleTemplates[_random.Next(scheduleTemplates.Length)];
        
        // Create schedule for all days of the week
        foreach (DayOfWeekEnum day in Enum.GetValues<DayOfWeekEnum>())
        {
          var isAvailable = template.Days.Contains(day);
          var schedule = new ProviderSchedule
          {
            ProviderId = provider.Id,
            DayOfWeek = day,
            IsAvailable = isAvailable,
            StartTime = isAvailable ? template.Start : null,
            EndTime = isAvailable ? template.End : null,
            // Add lunch break for longer days
            BreakStartTime = isAvailable && template.End.Subtract(template.Start).TotalHours > 8 ? new TimeSpan(12, 0, 0) : null,
            BreakEndTime = isAvailable && template.End.Subtract(template.Start).TotalHours > 8 ? new TimeSpan(13, 0, 0) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
          };

          _context.ProviderSchedules.Add(schedule);
        }
      }
      
      return Task.CompletedTask;
    }

    private Task SeedReviews(List<User> providers, List<User> clients)
    {
      var reviewComments = new[]
      {
        "Amazing experience! Highly recommend this professional. The attention to detail was incredible.",
        "Absolutely loved my appointment! The results exceeded my expectations. Will definitely be back!",
        "Professional, friendly, and skilled. The service was top-notch from start to finish.",
        "Great work! Very happy with the results. The artist really listened to what I wanted.",
        "Fantastic service! The atmosphere was relaxing and the results were perfect.",
        "Outstanding quality! I've never looked better. The technique was flawless.",
        "Wonderful experience! The professional was so talented and made me feel comfortable.",
        "Incredible skills! The final result was exactly what I was hoping for and more.",
        "Perfect! Great attention to detail and excellent customer service throughout.",
        "Amazing talent! I'm so happy with how everything turned out. Highly professional.",
        "Excellent work! Very satisfied with the service and the final results.",
        "Great experience! The professional was very knowledgeable and skilled.",
        "Love the results! Very professional and made me feel pampered throughout.",
        "Outstanding service! The quality was exceptional and worth every penny.",
        "Fantastic! The professional was very attentive to my needs and preferences.",
        "Brilliant work! I couldn't be happier with how everything turned out.",
        "Amazing service! Very professional and the results were beyond my expectations.",
        "Perfect experience! Great skills and wonderful customer service.",
        "Excellent! Very happy with the quality and professionalism shown.",
        "Outstanding! The professional really knows their craft. Highly recommended."
      };

      var lowRatingComments = new[]
      {
        "Service was okay but didn't quite meet my expectations. Room for improvement.",
        "Good but not great. The results were fine but nothing special.",
        "Average experience. The service was decent but could be better.",
        "Okay service. It was fine but I've had better experiences elsewhere."
      };

      foreach (var provider in providers)
      {
        var numReviews = _random.Next(5, 25); // 5-24 reviews per provider
        var reviewers = clients.OrderBy(x => _random.Next()).Take(numReviews);

        foreach (var reviewer in reviewers)
        {
          // 85% chance of 4-5 star reviews, 15% chance of 3 star or below
          var rating = _random.Next(1, 101) <= 85 ? _random.Next(4, 6) : _random.Next(2, 4);
          var comments = rating >= 4 ? reviewComments : lowRatingComments;

          var review = new Review
          {
            ReviewerId = reviewer.Id,
            RevieweeId = provider.Id,
            Rating = rating,
            Comment = comments[_random.Next(comments.Length)],
            CreatedAt = DateTime.UtcNow.AddDays(-_random.Next(1, 180)) // Reviews from past 6 months
          };

          _context.Reviews.Add(review);
        }
      }
      
      return Task.CompletedTask;
    }
  }
}
