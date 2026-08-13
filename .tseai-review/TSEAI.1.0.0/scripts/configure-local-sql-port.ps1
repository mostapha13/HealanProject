#Requires -RunAsAdministrator
[CmdletBinding()]
param(
    [ValidatePattern('^[A-Za-z0-9_]+$')]
    [string]$InstanceName = 'MSSQL',
    [ValidateRange(1024, 65535)]
    [int]$Port = 14330
)

$ErrorActionPreference = 'Stop'
$instanceNamesPath = 'HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\Instance Names\SQL'
$instanceId = (Get-ItemProperty -LiteralPath $instanceNamesPath).$InstanceName
if (-not $instanceId) { throw "SQL instance '$InstanceName' was not found." }

$tcpPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instanceId\MSSQLServer\SuperSocketNetLib\Tcp\IPAll"
if (-not (Test-Path -LiteralPath $tcpPath)) { throw "TCP registry path was not found: $tcpPath" }

$serviceName = "MSSQL`$$InstanceName"
$before = Get-ItemProperty -LiteralPath $tcpPath
$oldDynamic = [string]$before.TcpDynamicPorts
$oldPort = [string]$before.TcpPort
$service = Get-CimInstance Win32_Service | Where-Object { $_.Name -eq $serviceName }
if (-not $service) { throw "SQL service '$serviceName' was not found." }

$existingListeners = @(Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
if ($existingListeners.Count -gt 0) {
    $ownedByTarget = @($existingListeners | Where-Object { $_.OwningProcess -eq $service.ProcessId }).Count -eq $existingListeners.Count
    $alreadyConfigured = $oldDynamic -eq '' -and $oldPort -eq [string]$Port
    if ($service.State -eq 'Running' -and $ownedByTarget -and $alreadyConfigured) {
        [pscustomobject]@{
            Instance = $InstanceName
            Service = $serviceName
            FixedTcpPort = $Port
            Applied = $false
            AlreadyConfigured = $true
        } | ConvertTo-Json
        return
    }
    $owners = ($existingListeners.OwningProcess | Sort-Object -Unique) -join ','
    throw "TCP port $Port is already in use by process id(s): $owners."
}

try {
    Set-ItemProperty -LiteralPath $tcpPath -Name TcpDynamicPorts -Value ''
    Set-ItemProperty -LiteralPath $tcpPath -Name TcpPort -Value ([string]$Port)
    Restart-Service -Name $serviceName -Force
    (Get-Service -Name $serviceName).WaitForStatus('Running', [TimeSpan]::FromSeconds(60))

    $deadline = (Get-Date).AddSeconds(60)
    do {
        $service = Get-CimInstance Win32_Service | Where-Object { $_.Name -eq $serviceName }
        $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
            Where-Object { $_.OwningProcess -eq $service.ProcessId }
        if ($listener) { break }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)
    if (-not $listener) { throw "SQL Server did not listen on fixed TCP port $Port." }
}
catch {
    Set-ItemProperty -LiteralPath $tcpPath -Name TcpDynamicPorts -Value $oldDynamic
    Set-ItemProperty -LiteralPath $tcpPath -Name TcpPort -Value $oldPort
    Restart-Service -Name $serviceName -Force
    throw
}

[pscustomobject]@{
    Instance = $InstanceName
    Service = $serviceName
    FixedTcpPort = $Port
    PreviousDynamicPort = $oldDynamic
    Applied = $true
    AlreadyConfigured = $false
} | ConvertTo-Json
