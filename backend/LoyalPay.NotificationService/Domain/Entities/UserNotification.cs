using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.NotificationService.Domain.Entities;

[Table("UserNotifications")]
public class UserNotification
{
    [Key]
    public Guid NotificationId { get; set; }

    public Guid UserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
