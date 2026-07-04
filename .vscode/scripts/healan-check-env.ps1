Write-Host "dotnet:"
Get-Command dotnet -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

Write-Host "node:" (node -v)
Write-Host "npm:" (npm.cmd -v)

Write-Host "Listening Healan ports:"
netstat -ano | findstr ":4201 :4202 :6128 :44320 :6829 :5060 :6823"
