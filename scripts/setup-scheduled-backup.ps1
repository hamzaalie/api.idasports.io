# =============================================================================
# Automated Task Scheduler Setup for Database Backups
# =============================================================================
# This script creates a Windows scheduled task to automatically backup
# the database every day at 2:00 AM.
#
# IMPORTANT: Run this script as Administrator!
#
# Usage:
#   Right-click PowerShell → "Run as Administrator"
#   cd "K:\Scoutung platform\central-backend\scripts"
#   .\setup-scheduled-backup.ps1
# =============================================================================

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell"
    Write-Host "2. Select 'Run as Administrator'"
    Write-Host "3. Navigate to: cd `"K:\Scoutung platform\central-backend\scripts`""
    Write-Host "4. Run this script again: .\setup-scheduled-backup.ps1"
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Automated Backup Task Scheduler Setup" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$TaskName = "ScoutingPlatform-DatabaseBackup"
$TaskDescription = "Daily automated database backup for Scouting Platform"
$ScriptPath = "K:\Scoutung platform\central-backend\scripts\backup-database.ps1"
$BackupTime = "2:00AM"
$LogPath = "K:\Scoutung platform\backups\logs"

# Verify backup script exists
if (-not (Test-Path $ScriptPath)) {
    Write-Host "❌ ERROR: Backup script not found: $ScriptPath" -ForegroundColor Red
    Write-Host "Please ensure the backup-database.ps1 script exists before running setup." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Create log directory if it doesn't exist
if (-not (Test-Path $LogPath)) {
    New-Item -ItemType Directory -Path $LogPath -Force | Out-Null
    Write-Host "✅ Created log directory: $LogPath" -ForegroundColor Green
}

# Check if task already exists
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "⚠️  Task '$TaskName' already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    
    if ($overwrite -ne "yes") {
        Write-Host "❌ Setup cancelled" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 0
    }
    
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✅ Removed existing task" -ForegroundColor Green
}

# Create scheduled task action
Write-Host ""
Write-Host "⏳ Creating scheduled task..." -ForegroundColor Yellow

$Action = New-ScheduledTaskAction `
    -Execute "PowerShell.exe" `
    -Argument "-ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File `"$ScriptPath`"" `
    -WorkingDirectory "K:\Scoutung platform\central-backend\scripts"

# Create scheduled task trigger (Daily at 2:00 AM)
$Trigger = New-ScheduledTaskTrigger -Daily -At $BackupTime

# Create scheduled task settings
$Settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -DontStopOnIdleEnd `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# Create scheduled task principal (run as SYSTEM)
$Principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

# Register the scheduled task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $TaskDescription `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Force | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to create scheduled task" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Display task information
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Task Configuration" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "Task Name: $TaskName"
Write-Host "Description: $TaskDescription"
Write-Host "Schedule: Daily at $BackupTime"
Write-Host "Script: $ScriptPath"
Write-Host "Run As: SYSTEM (highest privileges)"
Write-Host ""

# Test the task
Write-Host "🧪 Would you like to run a test backup now? (yes/no)" -ForegroundColor Yellow
$runTest = Read-Host

if ($runTest -eq "yes") {
    Write-Host ""
    Write-Host "⏳ Running test backup..." -ForegroundColor Yellow
    Write-Host "   This may take a few minutes..." -ForegroundColor Gray
    
    Start-ScheduledTask -TaskName $TaskName
    
    # Wait for task to complete or timeout after 5 minutes
    $timeout = 300
    $elapsed = 0
    while ((Get-ScheduledTask -TaskName $TaskName).State -ne "Ready" -and $elapsed -lt $timeout) {
        Start-Sleep -Seconds 5
        $elapsed += 5
        Write-Host "." -NoNewline
    }
    Write-Host ""
    
    $TaskInfo = Get-ScheduledTask -TaskName $TaskName | Get-ScheduledTaskInfo
    
    if ($TaskInfo.LastTaskResult -eq 0) {
        Write-Host "✅ Test backup completed successfully!" -ForegroundColor Green
        
        # Show created backup
        $BackupDir = "K:\Scoutung platform\backups\database"
        if (Test-Path $BackupDir) {
            $LatestBackup = Get-ChildItem $BackupDir -Filter "backup_*.sql.*" | 
                Sort-Object LastWriteTime -Descending | 
                Select-Object -First 1
            
            if ($LatestBackup) {
                $size = [math]::Round($LatestBackup.Length / 1MB, 2)
                Write-Host ""
                Write-Host "Latest Backup:" -ForegroundColor Cyan
                Write-Host "   File: $($LatestBackup.Name)"
                Write-Host "   Size: ${size} MB"
                Write-Host "   Created: $($LatestBackup.LastWriteTime)"
            }
        }
    } else {
        Write-Host "⚠️  Test backup completed with code: $($TaskInfo.LastTaskResult)" -ForegroundColor Yellow
        Write-Host "Check the backup logs for details" -ForegroundColor Gray
    }
}

# Final instructions
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Database backups will now run automatically every day at $BackupTime" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify task in Task Scheduler: taskschd.msc"
Write-Host "2. Check backup directory: K:\Scoutung platform\backups\database"
Write-Host "3. Monitor first automated backup tomorrow at $BackupTime"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View task status:   Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Run task now:       Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  View task info:     Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"
Write-Host "  Disable task:       Disable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Enable task:        Enable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Remove task:        Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  Quick Start:        DATABASE_BACKUP_QUICK_START.md"
Write-Host "  Complete Guide:     DATABASE_BACKUP_GUIDE.md"
Write-Host "  Scheduler Details:  TASK_SCHEDULER_SETUP.md"
Write-Host ""
Read-Host "Press Enter to exit"
