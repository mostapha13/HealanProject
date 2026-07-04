using Healan.Domain.Doctors.Enums;
using Healan.Domain.MedicalFeeServices.Enums;
using Share.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.MedicalFeeServices.Entities;
public class CategoryType : IEnumKey
{
    public CategoryTypeId CategoryTypeId { get; set; }
    public string CategoryTypeName { get; set; }
    public byte Key => (byte)CategoryTypeId;

    public void SetValues(byte key, string name)
    {
        CategoryTypeId = (CategoryTypeId)key;
        CategoryTypeName = name;
    }
}
