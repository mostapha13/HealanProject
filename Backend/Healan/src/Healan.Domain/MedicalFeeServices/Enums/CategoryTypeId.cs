using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.MedicalFeeServices.Enums;
public enum CategoryTypeId : byte
{
    [Display(Name = "ویزیت پزشک عمومی")]
    GeneralVisit = 1,
    [Display(Name = "ویزیت پزشک متخصص")]
    SpecialistVisit = 2,
    [Display(Name = "آزمایشگاه")]
    Lab = 3,
    [Display(Name = "تصویربرداری")]
    Imaging = 4,
    [Display(Name = "اقدامات درمانی یا جراحی کوچک")]
    Procedure = 5,
    [Display(Name = "خدمات پرستاری تزریقات، پانسمان، تزریق وریدی")]
    Nursing = 6,
    [Display(Name = "فیزوتراپی، کار‌دمانی")]
    Therapy = 7,
    [Display(Name = "مشاوره تخصصی حضوری یا غیرحضوری")]
    Consultation = 8
}

