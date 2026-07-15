using Healan.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Share.Application.Common.Interfaces;
using Share.Domain.Exceptions;

namespace Healan.Application.Users.Commands.UpdateMyProfile;

public class UpdateMyProfileCommand : IRequest<UpdateMyProfileResult>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class UpdateMyProfileResult
{
    public long UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
}

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand, UpdateMyProfileResult>
{
    private readonly IApplicationDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UpdateMyProfileCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<UpdateMyProfileResult> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var identityId = _currentUser.UserId;
        if (identityId == Guid.Empty)
            throw new UnauthorizedAccessException("کاربر احراز هویت نشده است.");

        var first = request.FirstName?.Trim() ?? string.Empty;
        var last = request.LastName?.Trim() ?? string.Empty;
        var phone = request.PhoneNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(first) || string.IsNullOrWhiteSpace(last))
            throw new BadRequestExceptions("نام و نام خانوادگی الزامی است.");
        if (string.IsNullOrWhiteSpace(phone))
            throw new BadRequestExceptions("شماره موبایل الزامی است.");

        var user = await _db.Users.FirstOrDefaultAsync(
            u => u.IdentityUserId == identityId,
            cancellationToken);

        if (user == null)
            throw new NotFoundExceptions("کاربر کلینیک یافت نشد.");

        user.FirstName = first;
        user.LastName = last;
        user.PhoneNumber = phone;
        await _db.SaveChangesAsync(cancellationToken);

        return new UpdateMyProfileResult
        {
            UserId = user.UserId,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber ?? string.Empty,
        };
    }
}
