Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Push-Location (Join-Path $PSScriptRoot '..\..\backend')
try {
    mvn test
}
finally {
    Pop-Location
}
