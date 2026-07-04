using Healan.Domain.Insurances.Enums;
using Share.Domain.Entities;
using System.Collections.ObjectModel;

namespace Healan.Domain.Insurances.Entities;

public class InsuranceType : IEnumKey
{
    public InsuranceType()
    {
        //Insurances=new Collection<Insurance>();
    }
    public InsuranceTypeId InsuranceTypeId { get; set; }
    public string InsuranceTypeName { get; set; }

    public byte Key => (byte)InsuranceTypeId;

    public void SetValues(byte key, string name)
    {
        InsuranceTypeId = (InsuranceTypeId)key;
        InsuranceTypeName = name;
    }
    //public ICollection<Insurance> Insurances { get; set; }
}