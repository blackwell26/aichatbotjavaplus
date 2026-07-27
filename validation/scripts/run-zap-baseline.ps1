param(
    [string]$TargetUrl = 'http://localhost:4200'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$reportDir = Join-Path $PSScriptRoot '..\reports\zap'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

docker run --rm `
    -v "${reportDir}:/zap/wrk" `
    ghcr.io/zaproxy/zaproxy:stable `
    zap-baseline.py `
    -t $TargetUrl `
    -r zap-baseline-report.html
