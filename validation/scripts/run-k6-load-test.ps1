param(
    [string]$TargetUrl = 'http://localhost:8080'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'k6-chat-load-test.js'

docker run --rm -i `
    -e "TARGET_URL=$TargetUrl" `
    -v "${scriptPath}:/scripts/k6-chat-load-test.js:ro" `
    grafana/k6:latest `
    run /scripts/k6-chat-load-test.js
