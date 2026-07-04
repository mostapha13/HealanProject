using Healan.Application.Common.Interfaces;
using Healan.Domain.Insurances.Entities;
using Microsoft.EntityFrameworkCore;

namespace Healan.Application.Common.Services;

public interface IInvoiceCalculationService
{
    Task<InvoiceItemCalculationResult> CalculateAsync(
        long serviceTypeId,
        decimal basePrice,
        long? primaryInsuranceCompanyId,
        bool confirmPrimary,
        long? secondaryInsuranceCompanyId,
        bool confirmSecondary,
        CancellationToken cancellationToken);
}

public record InvoiceItemCalculationResult(
    decimal UnitPrice,
    decimal PrimaryInsuranceCovered,
    decimal SecondaryInsuranceCovered,
    long? InsuranceContractServiceId);

public class InvoiceCalculationService : IInvoiceCalculationService
{
    private readonly IApplicationDbContext _db;

    public InvoiceCalculationService(IApplicationDbContext db) => _db = db;

    public async Task<InvoiceItemCalculationResult> CalculateAsync(
        long serviceTypeId,
        decimal basePrice,
        long? primaryInsuranceCompanyId,
        bool confirmPrimary,
        long? secondaryInsuranceCompanyId,
        bool confirmSecondary,
        CancellationToken cancellationToken)
    {
        var unitPrice = basePrice;
        decimal primaryCovered = 0;
        decimal secondaryCovered = 0;
        long? contractServiceId = null;
        var now = DateTime.UtcNow;

        if (confirmPrimary && primaryInsuranceCompanyId.HasValue)
        {
            var primary = await FindContractServiceAsync(
                primaryInsuranceCompanyId.Value, serviceTypeId, now, cancellationToken);
            if (primary is not null)
            {
                unitPrice = primary.FinalPrice > 0 ? primary.FinalPrice : basePrice;
                primaryCovered = Math.Round(unitPrice * primary.CoveragePercentage / 100m, 2);
                contractServiceId = primary.InsuranceContractServiceId;
            }
        }

        var remaining = unitPrice - primaryCovered;

        if (confirmSecondary && secondaryInsuranceCompanyId.HasValue && remaining > 0)
        {
            var secondary = await FindContractServiceAsync(
                secondaryInsuranceCompanyId.Value, serviceTypeId, now, cancellationToken);
            if (secondary is not null)
            {
                secondaryCovered = Math.Round(remaining * secondary.CoveragePercentage / 100m, 2);
                if (secondary.CoPayment > 0)
                    secondaryCovered = Math.Max(0, secondaryCovered - secondary.CoPayment);
            }
        }

        return new InvoiceItemCalculationResult(unitPrice, primaryCovered, secondaryCovered, contractServiceId);
    }

    private Task<InsuranceContractService?> FindContractServiceAsync(
        long insuranceCompanyId,
        long serviceTypeId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        return _db.InsuranceContractServices
            .Include(x => x.InsuranceContract)
            .Where(x =>
                x.ServiceTypeId == serviceTypeId &&
                x.InsuranceContract.InsuranceCompanyId == insuranceCompanyId &&
                x.InsuranceContract.IsActive &&
                x.EffectiveFrom <= now &&
                (x.EffectiveTo == null || x.EffectiveTo >= now))
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
    }
}
