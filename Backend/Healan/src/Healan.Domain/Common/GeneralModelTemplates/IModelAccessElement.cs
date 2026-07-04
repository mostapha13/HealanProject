
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Healan.Domain.Common.GeneralModelTemplates
{
    public interface IModelAccessElement
    {
        int RowId { get; }
        int DossierRef { get; set; }
        DateTime CreationDate { get; set; }
        DateTime? ModificationDate { get; set; }
        DateTime? ConfirmationDate { get; set; }
        DateTime? RejectionDate { get; set; }
        long Creator { get; set; }
        long? Modifier { get; set; }
        long? Confirmer { get; set; }
        long? Rejector { get; set; }
    }
}
