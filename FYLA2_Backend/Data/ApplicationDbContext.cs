using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using FYLA2_Backend.Models;

namespace FYLA2_Backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Service> Services { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<PostLike> PostLikes { get; set; }
        public DbSet<PostBookmark> PostBookmarks { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<CommentLike> CommentLikes { get; set; }
        public DbSet<UserFollow> UserFollows { get; set; }
        public DbSet<Models.ServiceProvider> ServiceProviders { get; set; }
        public DbSet<PushToken> PushTokens { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<PaymentRecord> PaymentRecords { get; set; }
        public DbSet<PaymentSettings> PaymentSettings { get; set; }
        public DbSet<PaymentTransaction> PaymentTransactions { get; set; }
        public DbSet<ProviderSchedule> ProviderSchedules { get; set; }
        public DbSet<ProviderBlockedTime> ProviderBlockedTimes { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User relationships
            modelBuilder.Entity<User>()
                .HasMany(u => u.BookingsAsClient)
                .WithOne(b => b.Client)
                .HasForeignKey(b => b.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(u => u.BookingsAsProvider)
                .WithOne(b => b.Provider)
                .HasForeignKey(b => b.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Services)
                .WithOne(s => s.Provider)
                .HasForeignKey(s => s.ProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Review relationships
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Reviewer)
                .WithMany(u => u.ReviewsGiven)
                .HasForeignKey(r => r.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Reviewee)
                .WithMany(u => u.ReviewsReceived)
                .HasForeignKey(r => r.RevieweeId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message relationships
            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.MessagesSent)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany(u => u.MessagesReceived)
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            // Follow relationships
            modelBuilder.Entity<UserFollow>()
                .HasOne(uf => uf.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(uf => uf.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFollow>()
                .HasOne(uf => uf.Following)
                .WithMany(u => u.Followers)
                .HasForeignKey(uf => uf.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Prevent duplicate follows
            modelBuilder.Entity<UserFollow>()
                .HasIndex(uf => new { uf.FollowerId, uf.FollowingId })
                .IsUnique();

            // Prevent self-follow
            modelBuilder.Entity<UserFollow>()
                .ToTable(t => t.HasCheckConstraint("CK_UserFollow_NoSelfFollow", "FollowerId != FollowingId"));

            // PostLike unique constraint
            modelBuilder.Entity<PostLike>()
                .HasIndex(pl => new { pl.PostId, pl.UserId })
                .IsUnique();

            // Decimal precision for prices
            modelBuilder.Entity<Service>()
                .Property(s => s.Price)
                .HasPrecision(10, 2);

            modelBuilder.Entity<Booking>()
                .Property(b => b.TotalPrice)
                .HasPrecision(10, 2);

            // PushToken relationships and constraints
            modelBuilder.Entity<PushToken>()
                .HasOne(pt => pt.User)
                .WithMany()
                .HasForeignKey(pt => pt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Unique constraint for user-platform combination
            modelBuilder.Entity<PushToken>()
                .HasIndex(pt => new { pt.UserId, pt.Platform })
                .IsUnique();

            // PaymentSettings relationships
            modelBuilder.Entity<PaymentSettings>()
                .HasOne(ps => ps.Provider)
                .WithOne()
                .HasForeignKey<PaymentSettings>(ps => ps.ProviderId)
                .OnDelete(DeleteBehavior.Cascade);

            // PaymentTransaction relationships
            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(pt => pt.Booking)
                .WithMany()
                .HasForeignKey(pt => pt.BookingId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(pt => pt.Client)
                .WithMany()
                .HasForeignKey(pt => pt.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(pt => pt.Provider)
                .WithMany()
                .HasForeignKey(pt => pt.ProviderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PaymentTransaction>()
                .HasOne(pt => pt.OriginalTransaction)
                .WithMany(pt => pt.RefundTransactions)
                .HasForeignKey(pt => pt.OriginalTransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            // Decimal precision for payment amounts
            modelBuilder.Entity<PaymentTransaction>()
                .Property(pt => pt.Amount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<PaymentTransaction>()
                .Property(pt => pt.ServiceAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<PaymentTransaction>()
                .Property(pt => pt.TaxAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<PaymentTransaction>()
                .Property(pt => pt.PlatformFeeAmount)
                .HasPrecision(10, 2);

            modelBuilder.Entity<PaymentSettings>()
                .Property(ps => ps.DepositPercentage)
                .HasPrecision(5, 2);

            modelBuilder.Entity<PaymentSettings>()
                .Property(ps => ps.TaxRate)
                .HasPrecision(5, 2);

            // PostBookmark unique constraint
            modelBuilder.Entity<PostBookmark>()
                .HasIndex(pb => new { pb.PostId, pb.UserId })
                .IsUnique();

            // CommentLike unique constraint
            modelBuilder.Entity<CommentLike>()
                .HasIndex(cl => new { cl.CommentId, cl.UserId })
                .IsUnique();

            // ServiceProvider relationships
            modelBuilder.Entity<Models.ServiceProvider>()
                .HasOne(sp => sp.User)
                .WithOne(u => u.ServiceProvider)
                .HasForeignKey<Models.ServiceProvider>(sp => sp.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
