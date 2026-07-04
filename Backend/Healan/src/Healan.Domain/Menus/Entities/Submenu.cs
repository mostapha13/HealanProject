
using System.Collections.ObjectModel;

namespace Healan.Domain.Menus.Entities
{
    public class Submenu
    {
        public Submenu()
        {
         
        }
        public int SubmenuId { get; set; }
        public int MenuId { get; set; }
        public int SubmenuRow { get; set; }
        public string SubmenuTitle { get; set; }
        public int SubmenuWeight { get; set; }
        public bool HasSignature { get; set; }
        public string ComponentName { get; set; }
        public string SaveApiName { get; set; }
        public string FindApiName { get; set; }
        public string ConfirmApiName { get; set; }
        public string RejectApiName { get; set; }
        public string? ListApiName { get; set; }
        public string? SignatureSaveApiName { get; set; }
        public Dictionary<string, string> Label { get; set; }
        public Menu Menu { get; set; }


    }


}
