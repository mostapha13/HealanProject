using FileManager.Domain.Entities;
using Share.Domain.Entities;
using Share.Domain.Enums;
using System.Collections.Generic;

#nullable disable

namespace FileManager.Domain.Entities
{
    public partial class FileType : IEntity
    {
        public FileType()
        {
            Files = new HashSet<File>();
        }
        public FileTypeId Id { get; set; }
        public string Name { get; set; }

        public virtual ICollection<File> Files { get; set; }
    }
}
