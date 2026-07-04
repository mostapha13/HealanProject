using Healan.Domain.Orders.Enums;
using Share.Domain.Entities;

namespace Healan.Domain.Orders.Entities;
public class ImageType : IEnumKey
{
    public ImageTypeId ImageTypeId { get; set; }
    public string ImageTypeName { get; set; }
    public byte Key => (byte)ImageTypeId;

    public void SetValues(byte key, string name)
    {
        ImageTypeId = (ImageTypeId)key;
        ImageTypeName = name;
    }
}
