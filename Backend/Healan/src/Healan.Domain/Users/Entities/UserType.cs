using Healan.Domain.Users.Enums;
using Share.Domain.Entities;

public class UserType : IEnumKey
{

    public UserTypeId UserTypeId { get; set; }
    public string UserTypeName { get; set; }

    public byte Key => (byte)UserTypeId;

    public void SetValues(byte key, string name)
    {
        UserTypeId = (UserTypeId)key;
        UserTypeName = name;
    }
}