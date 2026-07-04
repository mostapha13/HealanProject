using Healan.Domain.Menus.Enums;
using System.Collections.ObjectModel;

namespace Healan.Domain.Menus.Entities
{
    public class Menu
    {
        public Menu()
        {
            Submenus = new ObservableCollection<Submenu>();
        }
        public int MenuId { get; set; }
        public string MenuTitle { get; set; }
        public int MenuWeight { get; set; }
        public HealanTypeId HealanTypeId { get; set; }
        public ICollection<Submenu> Submenus { get; set; }
    }


}
