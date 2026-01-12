# Windows Task Scheduler Setup for Automated Database Backups

## 🎯 Overview

This guide will help you set up automated daily backups using Windows Task Scheduler. Once configured, your database will be backed up automatically every day at 2:00 AM.

---

## 🚀 Quick Setup (Recommended)

### Automated Setup Script

Run this PowerShell script as **Administrator** to automatically create the scheduled task:

```powershell
# Open PowerShell as Administrator
# Right-click PowerShell → "Run as Administrator"

# Navigate to scripts directory
cd "K:\Scoutung platform\central-backend\scripts"

# Run setup script
.\setup-scheduled-backup.ps1
```

Save this script as `setup-scheduled-backup.ps1`:

```powershell
# =============================================================================
# Automated Task Scheduler Setup for Database Backups
# =============================================================================
# Run this script as Administrator to create the scheduled backup task
# =============================================================================

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell"
    Write-Host "2. Select 'Run as Administrator'"
    Write-Host "3. Run this script again"
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
        exit 0
    }
    
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "✅ Removed existing task" -ForegroundColor Green
}

# Create scheduled task action
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
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify task in Task Scheduler (taskschd.msc)"
Write-Host "2. Check backup directory: K:\Scoutung platform\backups\database"
Write-Host "3. Monitor first automated backup tomorrow at $BackupTime"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  View task status:  Get-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Run task now:      Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  View task history: Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"
Write-Host "  Disable task:      Disable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Enable task:       Enable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Remove task:       Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host ""
Write-Host "✅ Database backups will now run automatically every day at $BackupTime" -ForegroundColor Green
```

---

## 🔧 Manual Setup (Alternative)

If you prefer to set up the task manually using the GUI:

### Step 1: Open Task Scheduler

1. Press `Win + R`
2. Type `taskschd.msc`
3. Press Enter

### Step 2: Create New Task

1. In the right panel, click **"Create Task"** (NOT "Create Basic Task")
2. This opens the "Create Task" dialog

### Step 3: General Tab

Configure these settings:

- **Name:** `ScoutingPlatform-DatabaseBackup`
- **Description:** `Daily automated database backup for Scouting Platform`
- **Security options:**
  - ☑️ Select "Run whether user is logged on or not"
  - ☑️ Check "Run with highest privileges"
  - Select user: `SYSTEM` (or your admin account)

### Step 4: Triggers Tab

1. Click **"New"** button
2. Configure trigger:
   - **Begin the task:** On a schedule
   - **Settings:** Daily
   - **Start date:** Today's date
   - **Start time:** `2:00:00 AM`
   - **Recur every:** `1` days
   - **Advanced settings:**
     - ☑️ Enabled
     - Stop task if it runs longer than: `1 hour`

3. Click **OK**

### Step 5: Actions Tab

1. Click **"New"** button
2. Configure action:
   - **Action:** Start a program
   - **Program/script:** `PowerShell.exe`
   - **Add arguments:**
     ```
     -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "K:\Scoutung platform\central-backend\scripts\backup-database.ps1"
     ```
   - **Start in:** `K:\Scoutung platform\central-backend\scripts`

3. Click **OK**

### Step 6: Conditions Tab

Configure these settings:

- **Power:**
  - ☑️ Start the task only if the computer is on AC power (optional)
  - ☐ Stop if the computer switches to battery power
  - ☑️ Wake the computer to run this task (if desired)

- **Network:**
  - ☑️ Start only if the following network connection is available
  - Select: Any connection

### Step 7: Settings Tab

Configure these settings:

- ☑️ Allow task to be run on demand
- ☑️ Run task as soon as possible after a scheduled start is missed
- ☑️ If the task fails, restart every: `10 minutes`
- Attempt to restart up to: `3` times
- Stop the task if it runs longer than: `1 hour`
- If the running task does not end when requested: Stop the existing instance

### Step 8: Save Task

1. Click **OK**
2. If prompted, enter your administrator password
3. The task is now created and will run daily at 2:00 AM

---

## ✅ Verify Setup

### Check Task Status

```powershell
# View task details
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# View task information (last run, next run, etc.)
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo
```

**Expected Output:**
```
LastRunTime        : Never (or last run timestamp)
LastTaskResult     : 0 (0 = Success)
NextRunTime        : [Tomorrow at 2:00 AM]
NumberOfMissedRuns : 0
TaskName           : ScoutingPlatform-DatabaseBackup
```

### Run Test Backup

```powershell
# Run task immediately to test
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Monitor task status
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Select-Object TaskName, State, LastRunTime

# Check if backup was created
Get-ChildItem "K:\Scoutung platform\backups\database" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

### View Task History

**Method 1: PowerShell**
```powershell
# View last run result
$task = Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo
Write-Host "Last Run: $($task.LastRunTime)"
Write-Host "Result Code: $($task.LastTaskResult)"
Write-Host "Next Run: $($task.NextRunTime)"
```

**Method 2: Event Viewer**
1. Open Event Viewer (`eventvwr.msc`)
2. Navigate to: **Windows Logs → Application**
3. Filter by Source: **Task Scheduler**
4. Look for events related to "ScoutingPlatform-DatabaseBackup"

**Method 3: Task Scheduler GUI**
1. Open Task Scheduler (`taskschd.msc`)
2. Find your task in the list
3. Click on the "History" tab at the bottom
4. Review execution history

---

## 🛠️ Task Management

### Common Commands

```powershell
# Start task immediately
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Stop running task
Stop-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Disable task (stop automatic execution)
Disable-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Enable task (resume automatic execution)
Enable-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Remove task completely
Unregister-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" -Confirm:$false

# Export task to XML (for backup/migration)
Export-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Out-File "backup-task.xml"

# Import task from XML
Register-ScheduledTask -Xml (Get-Content "backup-task.xml" | Out-String) -TaskName "ScoutingPlatform-DatabaseBackup"
```

### Modify Task Schedule

To change the backup time:

```powershell
# Get current task
$Task = Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Create new trigger (e.g., change to 3:00 AM)
$NewTrigger = New-ScheduledTaskTrigger -Daily -At "3:00AM"

# Update task
Set-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" -Trigger $NewTrigger
```

---

## 📊 Monitoring

### Daily Health Check Script

Create `check-backup-health.ps1`:

```powershell
# =============================================================================
# Backup Health Check Script
# Run this daily to monitor backup system
# =============================================================================

$TaskName = "ScoutingPlatform-DatabaseBackup"
$BackupDir = "K:\Scoutung platform\backups\database"
$MaxAge = 26  # Alert if backup older than 26 hours

Write-Host ""
Write-Host "=== Backup System Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check scheduled task status
$Task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $Task) {
    Write-Host "❌ ERROR: Scheduled task not found!" -ForegroundColor Red
    exit 1
}

$TaskInfo = $Task | Get-ScheduledTaskInfo

Write-Host "Scheduled Task:" -ForegroundColor Cyan
Write-Host "  Status: $($Task.State)"
Write-Host "  Last Run: $($TaskInfo.LastRunTime)"
Write-Host "  Last Result: $($TaskInfo.LastTaskResult) $(if ($TaskInfo.LastTaskResult -eq 0) {'✅'} else {'❌'})"
Write-Host "  Next Run: $($TaskInfo.NextRunTime)"
Write-Host ""

# Check latest backup
$LatestBackup = Get-ChildItem $BackupDir -Filter "backup_*.sql.*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($LatestBackup) {
    $Age = (Get-Date) - $LatestBackup.LastWriteTime
    $Size = [math]::Round($LatestBackup.Length / 1MB, 2)
    
    Write-Host "Latest Backup:" -ForegroundColor Cyan
    Write-Host "  File: $($LatestBackup.Name)"
    Write-Host "  Size: ${Size} MB"
    Write-Host "  Age: $([math]::Round($Age.TotalHours, 1)) hours"
    
    if ($Age.TotalHours -gt $MaxAge) {
        Write-Host "  Status: ⚠️ WARNING - Backup is stale!" -ForegroundColor Red
    } else {
        Write-Host "  Status: ✅ OK" -ForegroundColor Green
    }
} else {
    Write-Host "❌ ERROR: No backups found!" -ForegroundColor Red
}

# Check disk space
Write-Host ""
Write-Host "Disk Space:" -ForegroundColor Cyan
$Drive = (Get-Item $BackupDir).PSDrive
$FreeSpace = (Get-PSDrive $Drive.Name).Free / 1GB
$UsedSpace = (Get-PSDrive $Drive.Name).Used / 1GB

Write-Host "  Drive: $($Drive.Name):"
Write-Host "  Free: $([math]::Round($FreeSpace, 2)) GB"
Write-Host "  Used: $([math]::Round($UsedSpace, 2)) GB"

if ($FreeSpace -lt 10) {
    Write-Host "  Status: ⚠️ WARNING - Low disk space!" -ForegroundColor Red
} else {
    Write-Host "  Status: ✅ OK" -ForegroundColor Green
}

Write-Host ""
```

Run this script daily or add it to your monitoring system.

---

## 🚨 Troubleshooting

### Task Not Running

**Check task status:**
```powershell
$Task = Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"
Write-Host "State: $($Task.State)"
```

**Common issues:**
- **Disabled:** Enable with `Enable-ScheduledTask`
- **Wrong schedule:** Verify trigger settings
- **Permission issues:** Ensure running with highest privileges

### Task Running But No Backup Created

1. **Check task history:**
   ```powershell
   Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo
   ```

2. **Run manually and check output:**
   ```powershell
   cd "K:\Scoutung platform\central-backend\scripts"
   .\backup-database.ps1
   ```

3. **Check PostgreSQL service:**
   ```powershell
   Get-Service -Name postgresql*
   ```

### Task Fails with Error Code

**Common error codes:**
- `0x0`: Success
- `0x1`: Incorrect function
- `0x2`: System cannot find file
- `0x41301`: Task is currently running
- `0x800710E0`: Task did not run because user account has expired

**Check error details:**
```powershell
$TaskInfo = Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo
Write-Host "Last Result: 0x$($TaskInfo.LastTaskResult.ToString('X'))"
```

---

## 📧 Email Notifications (Future Enhancement)

To receive email notifications when backups complete (or fail), modify the backup script to include email sending:

```powershell
# Add to end of backup-database.ps1

# Email configuration
$SmtpServer = "smtp.gmail.com"
$SmtpPort = 587
$EmailFrom = "backups@scoutingplatform.com"
$EmailTo = "admin@scoutingplatform.com"
$EmailPassword = "your-app-password"

# Send success email
$Subject = "✅ Database Backup Successful - $(Get-Date -Format 'yyyy-MM-dd')"
$Body = @"
Database backup completed successfully!

Backup File: $CompressedBackupPath
Backup Size: $([math]::Round($CompressedSize, 2)) MB
Timestamp: $(Get-Date)

Latest backups: $($Backups.Count) total
"@

Send-MailMessage -From $EmailFrom -To $EmailTo -Subject $Subject -Body $Body -SmtpServer $SmtpServer -Port $SmtpPort -UseSsl -Credential (New-Object System.Management.Automation.PSCredential($EmailFrom, (ConvertTo-SecureString $EmailPassword -AsPlainText -Force)))
```

---

## ✅ Checklist

After setup, verify:

- ☑️ Task appears in Task Scheduler
- ☑️ Task runs successfully when triggered manually
- ☑️ Backup files are created in correct directory
- ☑️ Backups are compressed properly
- ☑️ Old backups are cleaned up according to retention policy
- ☑️ Task is scheduled to run daily at 2:00 AM
- ☑️ Task has proper permissions (Run with highest privileges)
- ☑️ Monitoring script runs successfully

---

## 📞 Support

If you encounter issues:

1. Check [DATABASE_BACKUP_GUIDE.md](./DATABASE_BACKUP_GUIDE.md) for troubleshooting
2. Review Windows Event Viewer logs
3. Run backup script manually to see detailed error messages
4. Verify PostgreSQL service is running
5. Check database credentials in `.env` file

---

**Last Updated:** December 31, 2025  
**Version:** 1.0  
**Maintainer:** Scouting Platform Team
