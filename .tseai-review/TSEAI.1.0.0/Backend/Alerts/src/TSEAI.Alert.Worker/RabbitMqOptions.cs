namespace TSEAI.Alert.Worker;

public sealed class RabbitMqOptions
{
    public string Host { get; set; } = "rabbitmq";
    public int Port { get; set; } = 5672;
    public string UserName { get; set; } = "tseai";
    public string Password { get; set; } = "";
    public string VirtualHost { get; set; } = "/";
    public string Exchange { get; set; } = "tseai.alerts";
    public string RoutingKey { get; set; } = "alert.triggered";
}
