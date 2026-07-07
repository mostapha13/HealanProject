# Start local Redis for Healan development (Docker)
$ErrorActionPreference = "Stop"

$image = "public.ecr.aws/docker/library/redis:7-alpine"
$containerName = "healan-redis"
$password = "my_super_secret_password"

function Test-DockerReady {
    docker info *> $null
    return $LASTEXITCODE -eq 0
}

if (-not (Test-DockerReady)) {
    $dockerDesktop = @(
        "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
        "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($dockerDesktop) {
        Write-Host "Starting Docker Desktop..."
        Start-Process $dockerDesktop
        for ($i = 1; $i -le 60; $i++) {
            if (Test-DockerReady) { break }
            Start-Sleep -Seconds 3
        }
    }

    if (-not (Test-DockerReady)) {
        throw "Docker is not running. Start Docker Desktop and retry."
    }
}

$existing = docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"
if ($existing -eq $containerName) {
    $running = docker ps --filter "name=^/${containerName}$" --format "{{.Names}}"
    if ($running -eq $containerName) {
        Write-Host "Redis container '$containerName' is already running on port 6379."
    }
    else {
        docker start $containerName | Out-Null
        Write-Host "Started existing Redis container '$containerName'."
    }
}
else {
    docker pull $image | Out-Null
    docker run -d `
        --name $containerName `
        --restart unless-stopped `
        -p 6379:6379 `
        $image `
        redis-server --requirepass $password | Out-Null
    Write-Host "Created Redis container '$containerName' on port 6379."
}

docker exec $containerName redis-cli -a $password ping | Out-Null
Write-Host "Redis is ready at 127.0.0.1:6379"
