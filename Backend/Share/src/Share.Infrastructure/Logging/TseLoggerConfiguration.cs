using Serilog;
using Serilog.AspNetCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Serilog.Sinks.Http.BatchFormatters;
using Microsoft.Extensions.Configuration;
using Serilog.Formatting.Json;

namespace Share.Infrastructure.Logging
{
    public class TseLog : LoggerConfiguration
    {
        Serilog.ILogger CreateLogger(IConfiguration configuration)
        {
            var logstashAddress = configuration["LogstashAddress"];
            if (string.IsNullOrWhiteSpace(logstashAddress))
                logstashAddress = "http://172.20.16.75:50000/";
            var AppName = System.Reflection.Assembly.GetEntryAssembly().GetName().Name;
            return new LoggerConfiguration()
                  .ReadFrom.Configuration(configuration)
                  //.WriteTo.File("F:\\Thanh_let.txt")
                  //.MinimumLevel.Information()
                  .Enrich.FromLogContext()
                  //.WriteTo.Elasticsearch(new ElasticsearchSinkOptions(new Uri("http://172.19.2.21:50000")) {AutoRegisterTemplate=true,IndexFormat= "logstash",NumberOfReplicas=0,AutoRegisterTemplateVersion=AutoRegisterTemplateVersion.ESv7 })
                  .WriteTo.Console()
                  //.WriteTo.Http(logstashAddress)//,textFormatter: new ElasticsearchJsonFormatter(), batchFormatter: new ArrayBatchFormatter())
                  .WriteTo.Http(logstashAddress,
                  queueLimitBytes: 1,
                  batchSizeLimitBytes: 1,
                  period: TimeSpan.FromSeconds(3),
                  textFormatter: new JsonFormatter())
                 //.MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Debug)
                .Enrich.WithProperty("app", AppName)
                .Enrich.TseCustomerLogEnricher()
                .CreateLogger();
        }

        public static void Addlog()
        {
            var configuration = new ConfigurationBuilder()
      .AddEnvironmentVariables()
      .AddJsonFile("appsettings.json")
      .Build();

          //  Log.Logger = new TseLog().CreateLogger(configuration);
        }

    }
}
