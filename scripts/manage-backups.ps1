# =============================================================================
# List and Manage Database Backups
# =============================================================================
# This script provides a user-friendly interface to view, manage, and
# restore database backups.
#
# Usage: .\manage-backups.ps1
# =============================================================================

$BackupDir = "K:\Scoutung platform\backups\database"
$SafetyBackupDir = "K:\Scoutung platform\backups\safety"

function Show-Menu {
    Write-Host ""
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host "  Database Backup Management" -ForegroundColor Cyan
    Write-Host "==============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. List all backups"
    Write-Host "2. Create new backup"
    Write-Host "3. Restore from backup"
    Write-Host "4. Delete old backups"
    Write-Host "5. View backup statistics"
    Write-Host "6. Test backup integrity"
    Write-Host "7. Exit"
    Write-Host ""
}

function List-Backups {
    Write-Host ""
    Write-Host "=== Available Backups ===" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path $BackupDir)) {
        Write-Host "❌ Backup directory not found: $BackupDir" -ForegroundColor Red
        return
    }
    
    $Backups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | Sort-Object LastWriteTime -Descending
    
    if ($Backups.Count -eq 0) {
        Write-Host "No backups found." -ForegroundColor Yellow
        return
    }
    
    $index = 1
    foreach ($Backup in $Backups) {
        $size = [math]::Round($Backup.Length / 1MB, 2)
        $age = (Get-Date) - $Backup.LastWriteTime
        $ageStr = if ($age.Days -gt 0) { "$($age.Days) days ago" } 
                  elseif ($age.Hours -gt 0) { "$($age.Hours) hours ago" }
                  else { "$($age.Minutes) minutes ago" }
        
        Write-Host "$index. " -NoNewline
        Write-Host "$($Backup.Name)" -ForegroundColor Green
        Write-Host "   Size: ${size} MB | Created: $($Backup.LastWriteTime) | Age: $ageStr" -ForegroundColor Gray
        $index++
    }
    
    Write-Host ""
    Write-Host "Total backups: $($Backups.Count)" -ForegroundColor Cyan
}

function Create-Backup {
    Write-Host ""
    Write-Host "=== Creating New Backup ===" -ForegroundColor Cyan
    $scriptPath = Join-Path (Split-Path -Parent $PSCommandPath) "backup-database.ps1"
    
    if (Test-Path $scriptPath) {
        & $scriptPath
    } else {
        Write-Host "❌ Backup script not found: $scriptPath" -ForegroundColor Red
    }
}

function Restore-Backup {
    List-Backups
    
    Write-Host ""
    $backupNumber = Read-Host "Enter backup number to restore (or 'cancel' to abort)"
    
    if ($backupNumber -eq "cancel") {
        Write-Host "❌ Restore cancelled" -ForegroundColor Yellow
        return
    }
    
    $Backups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | Sort-Object LastWriteTime -Descending
    $index = [int]$backupNumber
    
    if ($index -lt 1 -or $index -gt $Backups.Count) {
        Write-Host "❌ Invalid backup number" -ForegroundColor Red
        return
    }
    
    $selectedBackup = $Backups[$index - 1]
    
    Write-Host ""
    Write-Host "Selected backup: $($selectedBackup.Name)" -ForegroundColor Green
    Write-Host ""
    
    $scriptPath = Join-Path (Split-Path -Parent $PSCommandPath) "restore-database.ps1"
    
    if (Test-Path $scriptPath) {
        & $scriptPath -BackupFile $selectedBackup.FullName
    } else {
        Write-Host "❌ Restore script not found: $scriptPath" -ForegroundColor Red
    }
}

function Delete-OldBackups {
    Write-Host ""
    $days = Read-Host "Delete backups older than how many days?"
    
    if (-not $days -or $days -notmatch '^\d+$') {
        Write-Host "❌ Invalid input" -ForegroundColor Red
        return
    }
    
    $CutoffDate = (Get-Date).AddDays(-[int]$days)
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | Where-Object {
        $_.LastWriteTime -lt $CutoffDate
    }
    
    if ($OldBackups.Count -eq 0) {
        Write-Host "✅ No backups older than $days days found" -ForegroundColor Green
        return
    }
    
    Write-Host ""
    Write-Host "Found $($OldBackups.Count) backup(s) older than $days days:" -ForegroundColor Yellow
    foreach ($backup in $OldBackups) {
        Write-Host "   - $($backup.Name) ($($backup.LastWriteTime))"
    }
    
    Write-Host ""
    $confirm = Read-Host "Delete these backups? (yes/no)"
    
    if ($confirm -eq "yes") {
        foreach ($backup in $OldBackups) {
            Remove-Item $backup.FullName -Force
            Write-Host "✅ Deleted: $($backup.Name)" -ForegroundColor Green
        }
        Write-Host ""
        Write-Host "✅ Deleted $($OldBackups.Count) old backup(s)" -ForegroundColor Green
    } else {
        Write-Host "❌ Deletion cancelled" -ForegroundColor Yellow
    }
}

function Show-Statistics {
    Write-Host ""
    Write-Host "=== Backup Statistics ===" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not (Test-Path $BackupDir)) {
        Write-Host "❌ Backup directory not found" -ForegroundColor Red
        return
    }
    
    $Backups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*"
    
    if ($Backups.Count -eq 0) {
        Write-Host "No backups found." -ForegroundColor Yellow
        return
    }
    
    $TotalSize = ($Backups | Measure-Object -Property Length -Sum).Sum / 1GB
    $OldestBackup = $Backups | Sort-Object LastWriteTime | Select-Object -First 1
    $NewestBackup = $Backups | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $AverageSize = ($Backups | Measure-Object -Property Length -Average).Average / 1MB
    
    Write-Host "Total Backups: $($Backups.Count)"
    Write-Host "Total Size: $([math]::Round($TotalSize, 2)) GB"
    Write-Host "Average Backup Size: $([math]::Round($AverageSize, 2)) MB"
    Write-Host "Oldest Backup: $($OldestBackup.LastWriteTime) - $($OldestBackup.Name)"
    Write-Host "Newest Backup: $($NewestBackup.LastWriteTime) - $($NewestBackup.Name)"
    
    # Check disk space
    $Drive = (Get-Item $BackupDir).PSDrive
    $FreeSpace = (Get-PSDrive $Drive.Name).Free / 1GB
    
    Write-Host ""
    Write-Host "Disk Space (${Drive}:)" -ForegroundColor Cyan
    Write-Host "Free Space: $([math]::Round($FreeSpace, 2)) GB"
    
    if ($FreeSpace -lt 10) {
        Write-Host "⚠️  WARNING: Low disk space!" -ForegroundColor Red
    }
}

function Test-BackupIntegrity {
    List-Backups
    
    Write-Host ""
    $backupNumber = Read-Host "Enter backup number to test (or 'cancel' to abort)"
    
    if ($backupNumber -eq "cancel") {
        return
    }
    
    $Backups = Get-ChildItem -Path $BackupDir -Filter "backup_*.sql.*" | Sort-Object LastWriteTime -Descending
    $index = [int]$backupNumber
    
    if ($index -lt 1 -or $index -gt $Backups.Count) {
        Write-Host "❌ Invalid backup number" -ForegroundColor Red
        return
    }
    
    $selectedBackup = $Backups[$index - 1]
    
    Write-Host ""
    Write-Host "⏳ Testing backup integrity: $($selectedBackup.Name)" -ForegroundColor Yellow
    Write-Host ""
    
    # Test file can be read
    try {
        $FileExtension = [System.IO.Path]::GetExtension($selectedBackup.FullName)
        
        if ($FileExtension -eq ".gz" -or $FileExtension -eq ".zip") {
            # Test compression integrity
            $sevenZip = "C:\Program Files\7-Zip\7z.exe"
            if (Test-Path $sevenZip) {
                $testResult = & $sevenZip t $selectedBackup.FullName 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ Compression integrity: OK" -ForegroundColor Green
                } else {
                    Write-Host "❌ Compression integrity: FAILED" -ForegroundColor Red
                    Write-Host $testResult
                    return
                }
            }
        }
        
        # Check file size
        $size = $selectedBackup.Length
        if ($size -lt 1KB) {
            Write-Host "⚠️  WARNING: Backup file is suspiciously small (< 1KB)" -ForegroundColor Yellow
        } else {
            Write-Host "✅ File size: OK ($([math]::Round($size / 1MB, 2)) MB)" -ForegroundColor Green
        }
        
        Write-Host ""
        Write-Host "✅ Backup integrity test passed!" -ForegroundColor Green
        Write-Host "Note: For complete validation, perform a test restore to a separate database." -ForegroundColor Gray
        
    } catch {
        Write-Host "❌ Integrity test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Main menu loop
while ($true) {
    Show-Menu
    $choice = Read-Host "Select an option (1-7)"
    
    switch ($choice) {
        "1" { List-Backups }
        "2" { Create-Backup }
        "3" { Restore-Backup }
        "4" { Delete-OldBackups }
        "5" { Show-Statistics }
        "6" { Test-BackupIntegrity }
        "7" { 
            Write-Host ""
            Write-Host "Goodbye!" -ForegroundColor Cyan
            exit 0
        }
        default {
            Write-Host "❌ Invalid option. Please select 1-7." -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Read-Host "Press Enter to continue"
}
