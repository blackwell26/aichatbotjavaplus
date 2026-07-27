Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location (Join-Path $PSScriptRoot '..\..\frontend')
try {
    npm test
}
finally {
    Pop-Location
}
