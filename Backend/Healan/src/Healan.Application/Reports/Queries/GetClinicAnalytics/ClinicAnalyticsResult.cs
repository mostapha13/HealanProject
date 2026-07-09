namespace Healan.Application.Reports.Queries.GetClinicAnalytics;

public class ClinicAnalyticsSummaryResult
{
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int ScheduledAppointments { get; set; }
    public int InProgressAppointments { get; set; }
    public int CancelledAppointments { get; set; }
    public int NoShowAppointments { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal PatientRevenue { get; set; }
    public decimal InsuranceRevenue { get; set; }
    public int PendingPayments { get; set; }
    public int PrescriptionCount { get; set; }
}

public class ClinicAnalyticsChartItemResult
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public int Count { get; set; }
}

public class ClinicAnalyticsTimePointResult
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public int Count { get; set; }
}

public class ClinicAnalyticsResult
{
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public ClinicAnalyticsSummaryResult Summary { get; set; } = new();
    public List<ClinicAnalyticsChartItemResult> AppointmentsByStatus { get; set; } = [];
    public List<ClinicAnalyticsTimePointResult> AppointmentsOverTime { get; set; } = [];
    public List<ClinicAnalyticsTimePointResult> RevenueOverTime { get; set; } = [];
    public List<ClinicAnalyticsChartItemResult> RevenueByPaymentMethod { get; set; } = [];
    public List<ClinicAnalyticsChartItemResult> TopServices { get; set; } = [];
    public List<ClinicAnalyticsChartItemResult> TopDoctors { get; set; } = [];
    public List<ClinicAnalyticsTimePointResult> PrescriptionsOverTime { get; set; } = [];
    public List<ClinicAnalyticsChartItemResult> PaymentStatusBreakdown { get; set; } = [];
}
