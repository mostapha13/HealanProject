using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace NegareshAI.Api.Data;

public sealed class NegareshDbContextFactory : IDesignTimeDbContextFactory<NegareshDbContext>
{
    public NegareshDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<NegareshDbContext>()
            .UseSqlServer(
                "Server=localhost;Database=NegareshAI;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;
        return new NegareshDbContext(options);
    }
}
