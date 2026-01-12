# =============================================================================
# PostgreSQL Database Backup Script for Scouting Platform
# =============================================================================
# This script creates compressed backups of the PostgreSQL database
# with timestamp, retention management, and error handling.
#
# Usage: .\backup-database.ps1
# Scheduled: Run daily via Windows Task Scheduler
# =============================================================================

param(
    [string]$BackupDir = "K:\Scoutung platform\backups\database",
    [int]$RetentionDays = 30
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

# Create backup directory if it doesn't exist
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "✅ Created backup directory: $BackupDir"
}

# Generate timestamp for backup filename
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFileName = "backup_${DB_NAME}_${Timestamp}.sql"
$BackupFilePath = Join-Path $BackupDir $BackupFileName
$CompressedBackupPath = "${BackupFilePath}.gz"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Database Backup Starting" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Database: $DB_NAME"
Write-Host "Host: $DB_HOST:$DB_PORT"
Write-Host "Backup Directory: $BackupDir"
Write-Host "Timestamp: $Timestamp"
Write-Host ""

# Set PostgreSQL password environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # Run pg_dump to create backup
    Write-Host "⏳ Creating database backup..." -ForegroundColor Yellow
    
    $pgDumpArgs = @(
        "-h", $DB_HOST,
        "-p", $DB_PORT,
        "-U", $DB_USER,
        "-F", "p",  # Plain text format
        "-f", $BackupFilePath,
        $DB_NAME
    )
    
    $process = Start-Process -FilePath "pg_dump" -ArgumentList $pgDumpArgs -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -ne 0) {
        throw "pg_dump failed with exit code $($process.ExitCode)"
    }
    
    # Check if backup file was created
    if (-not (Test-Path $BackupFilePath)) {
        throw "Backup file was not created"
    }
    
    $BackupSize = (Get-Item $BackupFilePath).Length / 1MB
    Write-Host "✅ Backup created successfully: $BackupFileName" -ForegroundColor Green
    Write-Host "   Size: $([math]::Round($BackupSize, 2)) MB"
    
    # Compress the backup using built-in Windows compression or 7-Zip if available
    Write-Host "⏳ Compressing backup..." -ForegroundColor Yellow
    
    # Try using 7-Zip first (if available)
    $sevenZip = "C:\Program Files\7-Zip\7z.exe"
    if (Test-Path $sevenZip) {
        & $sevenZip a -tgzip -mx=9 $CompressedBackupPath $BackupFilePath | Out-Null
        Remove-Item $BackupFilePath -Force
    }
    # Fallback to PowerShell compression
    else {
        Compress-Archive -Path $BackupFilePath -DestinationPath "${BackupFilePath}.zip" -Force
        Remove-Item $BackupFilePath -Force
        $CompressedBackupPath = "${BackupFilePath}.zip"
    }
    
    $CompressedSize = (Get-Item $CompressedBackupPath).Length / 1MB
    $CompressionRatio = [math]::Round((1 - ($CompressedSize / $BackupSize)) * 100, 1)
    
    Write-Host "✅ Backup compressed successfully" -ForegroundColor Green
    Write-Host "   Compressed Size: $([math]::Round($CompressedSize, 2)) MB"
    Write-Host "   Compression Ratio: $CompressionRatio%"
    
    # Clean up old backups based on retention policy
    Write-Host ""
    Write-Host "⏳ Cleaning up old backups (retention: $RetentionDays days)..." -ForegroundColor Yellow
    
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | Where-Object {
        $_.LastWriteTime -lt $CutoffDate
    }
    
    if ($OldBackups.Count -gt 0) {
        foreach ($OldBackup in $OldBackups) {
            Remove-Item $OldBackup.FullName -Force
            Write-Host "   🗑️  Removed old backup: $($OldBackup.Name)" -ForegroundColor Gray
        }
        Write-Host "✅ Removed $($OldBackups.Count) old backup(s)" -ForegroundColor Green
    } else {
        Write-Host "✅ No old backups to remove" -ForegroundColor Green
    }
    
    # Display backup summary
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "  Backup Completed Successfully" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "Backup File: $CompressedBackupPath"
    Write-Host "Backup Size: $([math]::Round($CompressedSize, 2)) MB"
    
    # List recent backups
    Write-Host ""
    Write-Host "Recent Backups:" -ForegroundColor Cyan
    Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 5 | 
        ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "   📦 $($_.Name) - ${size} MB - $($_.LastWriteTime)"
        }
    
    Write-Host ""
    Write-Host "✅ Backup process completed successfully!" -ForegroundColor Green
    exit 0
    
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Backup failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure PostgreSQL is running"
    Write-Host "2. Verify database credentials in .env file"
    Write-Host "3. Check that pg_dump is in your PATH"
    Write-Host "4. Ensure you have write permissions to the backup directory"
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
