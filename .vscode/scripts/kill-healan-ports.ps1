$ports = @(4201, 4202, 5254, 6128, 44320, 6829, 5060, 6823)
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    $processId = $conn.OwningProcess
    if ($processId -and $processId -ne 0) {
      Write-Host "Stopping PID $processId on port $port"
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

$healanDllPattern = 'Healan\\Doctor\\Backend\\(Healan|IdentityProvider|FileManager|Share)\\'
Get-CimInstance Win32_Process -Filter "Name='dotnet.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -match $healanDllPattern -and $_.CommandLine -match '\.dll' } |
  ForEach-Object {
    Write-Host "Stopping Healan backend PID $($_.ProcessId)"
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
  }

# Release MSBuild/Roslyn file locks (Share.Infrastructure.dll etc.)
$dotnetPaths = @(
  'C:\Program Files\dotnet\dotnet.exe',
  'C:\Program Files (x86)\dotnet\dotnet.exe'
)
foreach ($dotnet in $dotnetPaths) {
  if (Test-Path $dotnet) {
    Write-Host "Shutting down build servers: $dotnet"
    & $dotnet build-server shutdown 2>$null
  }
}

Start-Sleep -Seconds 1
Write-Host "Healan dev ports and build locks cleared."
