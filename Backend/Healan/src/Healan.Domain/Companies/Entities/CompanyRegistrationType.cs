using Healan.Domain.Companies.Enums;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Companies.Entities;
public class CompanyRegistrationType : IEnumKey
{
    public CompanyRegistrationType()
    {
        Companies = new Collection<Company>();
    }
    public CompanyRegistrationTypeId CompanyRegistrationTypeId { get; set; }
    public string CompanyRegistrationTypeName { get; set; }
    public ICollection<Company> Companies { get; set; }

    public byte Key => (byte)CompanyRegistrationTypeId;

    public void SetValues(byte key, string name)
    {
        CompanyRegistrationTypeId = (CompanyRegistrationTypeId)key;
        CompanyRegistrationTypeName = name;
    }
}