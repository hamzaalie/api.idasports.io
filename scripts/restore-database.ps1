# =============================================================================
# PostgreSQL Database Restore Script for Scouting Platform
# =============================================================================
# This script restores the PostgreSQL database from a backup file
# with verification and safety checks.
#
# Usage: .\restore-database.ps1 -BackupFile "path\to\backup.sql.gz"
# Warning: This will OVERWRITE the existing database!
# =============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    
    [switch]$Force,
    [switch]$CreateNew
)

# Load environment variables from .env file
$EnvFile = "K:\Scoutung platform\central-backend\.env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

# Database configuration from environment variables
$DB_HOST = $env:DATABASE_HOST
$DB_PORT = $env:DATABASE_PORT
$DB_NAME = $env:DATABASE_NAME
$DB_USER = $env:DATABASE_USERNAME
$DB_PASSWORD = $env:DATABASE_PASSWORD

# Validate required variables
if (-not $DB_HOST -or -not $DB_NAME -or -not $DB_USER -or -not $DB_PASSWORD) {
    Write-Error "❌ ERROR: Missing database configuration in .env file"
    Write-Host "Required: DATABASE_HOST, DATABASE_NAME, DATABASE_USERNAME, DATABASE_PASSWORD"
    exit 1
}

# Check if backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Error "❌ ERROR: Backup file not found: $BackupFile"
    exit 1
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Database Restore Utility" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Database: $DB_NAME"
Write-Host "Host: $DB_HOST:$DB_PORT"
Write-Host "Backup File: $BackupFile"
Write-Host ""

# Safety confirmation unless -Force is used
if (-not $Force) {
    Write-Host "⚠️  WARNING: This will OVERWRITE the existing database!" -ForegroundColor Red
    Write-Host ""
    $confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-Host "❌ Restore cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Decompress backup file if needed
    $TempSqlFile = $null
    $FileExtension = [System.IO.Path]::GetExtension($BackupFile)
    
    if ($FileExtension -eq ".gz") {
        Write-Host "⏳ Decompressing backup file..." -ForegroundColor Yellow
        $TempSqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
        
        # Try using 7-Zip first
        $sevenZip = "C:\Program Files\7-Zip\7z.exe"
        if (Test-Path $sevenZip) {
            & $sevenZip e -so $BackupFile > $TempSqlFile
        } else {
            Write-Error "❌ ERROR: 7-Zip not found. Please install 7-Zip to decompress .gz files"
            exit 1
        }
        
        Write-Host "✅ Backup decompressed" -ForegroundColor Green
        $SqlFile = $TempSqlFile
    } elseif ($FileExtension -eq ".zip") {
        Write-Host "⏳ Extracting backup file..." -ForegroundColor Yellow
        $TempDir = Join-Path $env:TEMP "db_restore_$(Get-Date -Format 'yyyyMMddHHmmss')"
        Expand-Archive -Path $BackupFile -DestinationPath $TempDir -Force
        $SqlFile = Get-ChildItem -Path $TempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
        Write-Host "✅ Backup extracted" -ForegroundColor Green
    } else {
        $SqlFile = $BackupFile
    }
    
    if (-not (Test-Path $SqlFile)) {
        throw "SQL file not found after extraction"
    }
    
    # Create a safety backup of current database before restore (optional but recommended)
    if (-not $CreateNew) {
        Write-Host ""
        Write-Host "⏳ Creating safety backup of current database..." -ForegroundColor Yellow
        $SafetyBackupDir = "K:\Scoutung platform\backups\safety"
        if (-not (Test-Path $SafetyBackupDir)) {
            New-Item -ItemType Directory -Path $SafetyBackupDir -Force | Out-Null
        }
        
        $SafetyTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $SafetyBackupFile = Join-Path $SafetyBackupDir "safety_backup_${SafetyTimestamp}.sql"
        
        $pgDumpArgs = @(
            "-h", $DB_HOST,
            "-p", $DB_PORT,
            "-U", $DB_USER,
            "-F", "p",
            "-f", $SafetyBackupFile,
            $DB_NAME
        )
        
        $process = Start-Process -FilePath "pg_dump" -ArgumentList $pgDumpArgs -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ Safety backup created: $SafetyBackupFile" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: Could not create safety backup" -ForegroundColor Yellow
        }
    }
    
    # Drop and recreate database if -CreateNew is specified
    if ($CreateNew) {
        Write-Host ""
        Write-Host "⏳ Dropping and recreating database..." -ForegroundColor Yellow
        
        # Connect to postgres database to drop/create
        $psqlDropArgs = @(
            "-h", $DB_HOST,
            "-p", $DB_PORT,
            "-U", $DB_USER,
            "-d", "postgres",
            "-c", "DROP DATABASE IF EXISTS `"$DB_NAME`"; CREATE DATABASE `"$DB_NAME`";"
        )
        
        $process = Start-Process -FilePath "psql" -ArgumentList $psqlDropArgs -NoNewWindow -Wait -PassThru
        
        if ($process.ExitCode -ne 0) {
            throw "Failed to recreate database"
        }
        
        Write-Host "✅ Database recreated" -ForegroundColor Green
    }
    
    # Restore database from SQL file
    Write-Host ""
    Write-Host "⏳ Restoring database from backup..." -ForegroundColor Yellow
    Write-Host "   This may take several minutes depending on database size..." -ForegroundColor Gray
    
    $psqlArgs = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $DB_NAME,
        "-f", $SqlFile
    )
    
    $process = Start-Process -FilePath "psql" -ArgumentList $psqlArgs -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -ne 0) {
        throw "psql restore failed with exit code $($process.ExitCode)"
    }
    
    Write-Host "✅ Database restored successfully!" -ForegroundColor Green
    
    # Verify restore by checking table count
    Write-Host ""
    Write-Host "⏳ Verifying restore..." -ForegroundColor Yellow
    
    $verifyQuery = "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
    $psqlVerifyArgs = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-d", $DB_NAME,
        "-t",
        "-c", $verifyQuery
    )
    
    $tableCount = & psql @psqlVerifyArgs
    $tableCount = $tableCount.Trim()
    
    Write-Host "✅ Verification complete: $tableCount tables found" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "  Database Restore Completed Successfully" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "Database: $DB_NAME"
    Write-Host "Tables: $tableCount"
    Write-Host ""
    Write-Host "✅ Restore process completed successfully!" -ForegroundColor Green
    exit 0
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Restore failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure PostgreSQL is running"
    Write-Host "2. Verify database credentials in .env file"
    Write-Host "3. Check that psql is in your PATH"
    Write-Host "4. Verify the backup file is not corrupted"
    Write-Host "5. Check PostgreSQL logs for detailed error messages"
    exit 1
} finally {
    # Clean up temporary files
    if ($TempSqlFile -and (Test-Path $TempSqlFile)) {
        Remove-Item $TempSqlFile -Force -ErrorAction SilentlyContinue
    }
    if ($TempDir -and (Test-Path $TempDir)) {
        Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
