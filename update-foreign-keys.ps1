# Update Foreign Key Constraints for User Deletion
# This script updates the database foreign key constraints to allow user deletion

# Load environment variables
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
}

$DB_HOST = $env:DATABASE_HOST
$DB_PORT = $env:DATABASE_PORT
$DB_NAME = $env:DATABASE_NAME
$DB_USER = $env:DATABASE_USERNAME
$DB_PASSWORD = $env:DATABASE_PASSWORD

Write-Host "Updating foreign key constraints..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME on $DB_HOST:$DB_PORT" -ForegroundColor Yellow

# Set PGPASSWORD environment variable for psql
$env:PGPASSWORD = $DB_PASSWORD

# Run the SQL script
$sqlFile = Join-Path $PSScriptRoot "update-foreign-keys.sql"

if (Test-Path $sqlFile) {
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nForeign key constraints updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nError updating foreign key constraints. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "SQL file not found: $sqlFile" -ForegroundColor Red
}

# Clear the password from environment
$env:PGPASSWORD = $null
