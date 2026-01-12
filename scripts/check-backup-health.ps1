# =============================================================================
# Backup System Health Check
# =============================================================================
# Quick status check for database backup system
# Run this regularly to monitor backup health
#
# Usage: .\check-backup-health.ps1
# =============================================================================

$TaskName = "ScoutingPlatform-DatabaseBackup"
$BackupDir = "K:\Scoutung platform\backups\database"
$MaxAge = 26  # Alert if backup older than 26 hours

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Database Backup System Health Check" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking backup system status..." -ForegroundColor Gray
Write-Host ""

$AllHealthy = $true

# ============================================
# Check 1: Scheduled Task Status
# ============================================
Write-Host "1. Scheduled Task Status" -ForegroundColor Cyan
Write-Host "   ────────────────────────────────────" -ForegroundColor Gray

$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $Task) {
    Write-Host "   ❌ ERROR: Scheduled task not found!" -ForegroundColor Red
    Write-Host "   Action: Run setup-scheduled-backup.ps1 as Administrator" -ForegroundColor Yellow
    $AllHealthy = $false
} else {
    $TaskInfo = $Task | Get-ScheduledTaskInfo
    
    Write-Host "   Task State: " -NoNewline
    if ($Task.State -eq "Ready") {
        Write-Host "$($Task.State) ✅" -ForegroundColor Green
    } else {
        Write-Host "$($Task.State) ⚠️" -ForegroundColor Yellow
        $AllHealthy = $false
    }
    
    Write-Host "   Last Run: $($TaskInfo.LastRunTime)"
    Write-Host "   Last Result: " -NoNewline
    if ($TaskInfo.LastTaskResult -eq 0) {
        Write-Host "Success (0) ✅" -ForegroundColor Green
    } else {
        Write-Host "Failed ($($TaskInfo.LastTaskResult)) ❌" -ForegroundColor Red
        $AllHealthy = $false
    }
    Write-Host "   Next Run: $($TaskInfo.NextRunTime)"
}

Write-Host ""

# ============================================
# Check 2: Backup Directory
# ============================================
Write-Host "2. Backup Directory Status" -ForegroundColor Cyan
Write-Host "   ────────────────────────────────────" -ForegroundColor Gray

if (-not (Test-Path $BackupDir)) {
    Write-Host "   ❌ ERROR: Backup directory not found!" -ForegroundColor Red
    Write-Host "   Path: $BackupDir" -ForegroundColor Yellow
    Write-Host "   Action: Run backup-database.ps1 to create initial backup" -ForegroundColor Yellow
    $AllHealthy = $false
} else {
    Write-Host "   Directory: $BackupDir ✅" -ForegroundColor Green
    
    # Count backups
    $Backups = Get-ChildItem $BackupDir -Filter "backup_*.sql.*" -ErrorAction SilentlyContinue
    Write-Host "   Total Backups: $($Backups.Count)"
    
    # Calculate total size
    if ($Backups.Count -gt 0) {
        $TotalSize = ($Backups | Measure-Object -Property Length -Sum).Sum / 1GB
        Write-Host "   Total Size: $([math]::Round($TotalSize, 2)) GB"
    }
}

Write-Host ""

# ============================================
# Check 3: Latest Backup Status
# ============================================
Write-Host "3. Latest Backup Status" -ForegroundColor Cyan
Write-Host "   ────────────────────────────────────" -ForegroundColor Gray

if (Test-Path $BackupDir) {
    $LatestBackup = Get-ChildItem $BackupDir -Filter "backup_*.sql.*" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1

    if ($LatestBackup) {
        $Age = (Get-Date) - $LatestBackup.LastWriteTime
        $AgeHours = [math]::Round($Age.TotalHours, 1)
        $Size = [math]::Round($LatestBackup.Length / 1MB, 2)
        
        Write-Host "   File: $($LatestBackup.Name)"
        Write-Host "   Size: ${Size} MB"
        Write-Host "   Created: $($LatestBackup.LastWriteTime)"
        Write-Host "   Age: ${AgeHours} hours ago " -NoNewline
        
        if ($Age.TotalHours -gt $MaxAge) {
            Write-Host "⚠️ WARNING - Backup is stale!" -ForegroundColor Red
            Write-Host "   Action: Check scheduled task or run backup manually" -ForegroundColor Yellow
            $AllHealthy = $false
        } else {
            Write-Host "✅" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ ERROR: No backups found!" -ForegroundColor Red
        Write-Host "   Action: Run backup-database.ps1 to create first backup" -ForegroundColor Yellow
        $AllHealthy = $false
    }
} else {
    Write-Host "   ⚠️ Backup directory does not exist" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# Check 4: Disk Space
# ============================================
Write-Host "4. Disk Space Status" -ForegroundColor Cyan
Write-Host "   ────────────────────────────────────" -ForegroundColor Gray

if (Test-Path $BackupDir) {
    $Drive = (Get-Item $BackupDir).PSDrive
    $DriveInfo = Get-PSDrive $Drive.Name
    $FreeSpace = $DriveInfo.Free / 1GB
    $UsedSpace = $DriveInfo.Used / 1GB
    $TotalSpace = ($DriveInfo.Free + $DriveInfo.Used) / 1GB
    $PercentFree = [math]::Round(($FreeSpace / $TotalSpace) * 100, 1)
    
    Write-Host "   Drive: $($Drive.Name):"
    Write-Host "   Total: $([math]::Round($TotalSpace, 2)) GB"
    Write-Host "   Used: $([math]::Round($UsedSpace, 2)) GB"
    Write-Host "   Free: $([math]::Round($FreeSpace, 2)) GB ($PercentFree%) " -NoNewline
    
    if ($FreeSpace -lt 10) {
        Write-Host "❌ CRITICAL - Low disk space!" -ForegroundColor Red
        Write-Host "   Action: Delete old backups or add more storage" -ForegroundColor Yellow
        $AllHealthy = $false
    } elseif ($FreeSpace -lt 50) {
        Write-Host "⚠️ WARNING - Disk space getting low" -ForegroundColor Yellow
        $AllHealthy = $false
    } else {
        Write-Host "✅" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# Check 5: PostgreSQL Service
# ============================================
Write-Host "5. PostgreSQL Service Status" -ForegroundColor Cyan
Write-Host "   ────────────────────────────────────" -ForegroundColor Gray

$PgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($PgService) {
    Write-Host "   Service: $($PgService.Name)"
    Write-Host "   Status: " -NoNewline
    if ($PgService.Status -eq "Running") {
        Write-Host "$($PgService.Status) ✅" -ForegroundColor Green
    } else {
        Write-Host "$($PgService.Status) ❌" -ForegroundColor Red
        Write-Host "   Action: Start PostgreSQL service" -ForegroundColor Yellow
        $AllHealthy = $false
    }
} else {
    Write-Host "   ⚠️ PostgreSQL service not found" -ForegroundColor Yellow
    Write-Host "   Note: This may be normal if using external database" -ForegroundColor Gray
}

Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

if ($AllHealthy) {
    Write-Host "✅ All systems operational - Backup system is healthy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Recent Backups:" -ForegroundColor Cyan
    if (Test-Path $BackupDir) {
        Get-ChildItem $BackupDir -Filter "backup_*.sql.*" | 
            Sort-Object LastWriteTime -Descending | 
            Select-Object -First 5 | 
            ForEach-Object {
                $size = [math]::Round($_.Length / 1MB, 2)
                $age = (Get-Date) - $_.LastWriteTime
                $ageStr = if ($age.Days -gt 0) { "$($age.Days)d ago" } 
                          elseif ($age.Hours -gt 0) { "$($age.Hours)h ago" }
                          else { "$($age.Minutes)m ago" }
                Write-Host "   📦 $($_.Name) - ${size} MB - $ageStr"
            }
    }
} else {
    Write-Host "⚠️  Issues detected - Please review the checks above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick Actions:" -ForegroundColor Cyan
    Write-Host "   Create backup now:    .\backup-database.ps1"
    Write-Host "   Setup automation:     .\setup-scheduled-backup.ps1 (as Admin)"
    Write-Host "   Manage backups:       .\manage-backups.ps1"
    Write-Host "   Full documentation:   ..\DATABASE_BACKUP_GUIDE.md"
}

Write-Host ""
Write-Host "Last checked: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
