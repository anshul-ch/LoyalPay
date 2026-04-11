using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LoyalPay.NotificationService.Domain.Entities;

[Table("NotificationUserProfiles")]
public class NotificationUserProfile
{
    [Key]
    public Guid UserId { get; set; }

    [MaxLength(255)]
    public string? Email { get; set; }

    [MaxLength(200)]
    public string? FullName { get; set; }

    public DateTime UpdatedAt { get; set; }
}
