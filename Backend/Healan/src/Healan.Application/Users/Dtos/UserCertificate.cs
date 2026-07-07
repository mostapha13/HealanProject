using Healan.Domain.Users.Enums;

namespace Healan.Application.Users.Dtos;

public record UserCertificate
{
    public int AttachmentId { get; set; }
    public string Title { get; set; }
}


public class CurrentUserResponse
{
    public UserSummaryDto UserSummaryReply { get; set; } = new();
    public bool HasAccessToConfirmForm { get; set; }
    public bool HasConfirmed { get; set; }
    public Guid? MarketMakerAccessRequestId { get; set; }
    public bool IsCashMarketBroker { get; set; }
    public MarketMakerAccessRequestStateId MarketMakerAccessRequestStateId { get; set; }

}