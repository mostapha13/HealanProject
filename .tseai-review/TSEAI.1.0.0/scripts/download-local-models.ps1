[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $PSScriptRoot "..\models")
)

$ErrorActionPreference = "Stop"
$destinationPath = [IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null

$models = @(
    @{
        File = "Qwen3.5-4B-UD-Q4_K_XL.gguf"
        Url = "https://huggingface.co/unsloth/Qwen3.5-4B-GGUF/resolve/main/Qwen3.5-4B-UD-Q4_K_XL.gguf?download=true"
        Sha256 = "b252c5610a42ca82d20fe2a12813e9d069eed89292907e26c783eeb0bc961bc7"
    },
    @{
        File = "Qwen3-Embedding-0.6B-Q8_0.gguf"
        Url = "https://huggingface.co/Qwen/Qwen3-Embedding-0.6B-GGUF/resolve/main/Qwen3-Embedding-0.6B-Q8_0.gguf?download=true"
        Sha256 = "06507c7b42688469c4e7298b0a1e16deff06caf291cf0a5b278c308249c3e439"
    }
)

foreach ($model in $models) {
    $target = Join-Path $destinationPath $model.File
    if (Test-Path -LiteralPath $target) {
        $existingHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $target).Hash.ToLowerInvariant()
        if ($existingHash -eq $model.Sha256) {
            Write-Host "Verified $($model.File)"
            continue
        }
        throw "Existing model has an unexpected checksum: $target"
    }

    $partial = "$target.part"
    Write-Host "Downloading $($model.File)..."
    & curl.exe -L --fail --retry 5 --retry-delay 3 --continue-at - --output $partial $model.Url
    if ($LASTEXITCODE -ne 0) { throw "Download failed: $($model.File)" }

    $actualHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $partial).Hash.ToLowerInvariant()
    if ($actualHash -ne $model.Sha256) {
        throw "Checksum mismatch for $($model.File). Expected $($model.Sha256), got $actualHash."
    }
    Move-Item -LiteralPath $partial -Destination $target
    Write-Host "Downloaded and verified $($model.File)"
}

Write-Host "Local model set is ready in $destinationPath"
