# Database Backup & Restore Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Backup Scripts](#backup-scripts)
- [Restore Procedures](#restore-procedures)
- [Automated Backups](#automated-backups)
- [Disaster Recovery](#disaster-recovery)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## 🎯 Overview

This guide covers the complete database backup and restore system for the Scouting Platform. The system includes:

- **Automated daily backups** with compression
- **30-day retention policy** (configurable)
- **One-click restore** with safety backups
- **Interactive management** interface
- **Disaster recovery** procedures

### Backup Location
```
K:\Scoutung platform\backups\
├── database\          # Regular automated backups
└── safety\            # Safety backups created before restores
```

---

## 🚀 Quick Start

### Create Your First Backup

```powershell
cd "K:\Scoutung platform\central-backend\scripts"
.\backup-database.ps1
```

The script will:
1. ✅ Load database credentials from `.env`
2. ✅ Create timestamped backup file
3. ✅ Compress the backup (save ~70% space)
4. ✅ Clean up old backups (30+ days)

**Example Output:**
```
==============================================================================
  Database Backup Starting
==============================================================================
Database: scouting_platform
Host: localhost:5432
Backup Directory: K:\Scoutung platform\backups\database
Timestamp: 2025-12-31_14-30-00

⏳ Creating database backup...
✅ Backup created successfully: backup_scouting_platform_2025-12-31_14-30-00.sql
   Size: 45.23 MB

⏳ Compressing backup...
✅ Backup compressed successfully
   Compressed Size: 12.87 MB
   Compression Ratio: 71.5%

✅ Backup process completed successfully!
```

---

## 📦 Backup Scripts

### 1. Manual Backup
Create an immediate backup:

```powershell
.\backup-database.ps1
```

**Custom retention period:**
```powershell
.\backup-database.ps1 -RetentionDays 60
```

**Custom backup directory:**
```powershell
.\backup-database.ps1 -BackupDir "D:\Backups"
```

### 2. Interactive Management
Launch the backup management interface:

```powershell
.\manage-backups.ps1
```

**Features:**
- 📋 List all backups
- ➕ Create new backup
- ♻️ Restore from backup
- 🗑️ Delete old backups
- 📊 View backup statistics
- ✅ Test backup integrity

### 3. Backup Configuration
Edit `backup.config` to customize:

```ini
# Retention period (days)
RETENTION_DAYS=30

# Backup directory
BACKUP_DIR=K:\Scoutung platform\backups\database

# Enable compression
COMPRESSION_ENABLED=true

# Safety backups before restore
SAFETY_BACKUP_ENABLED=true
```

---

## ♻️ Restore Procedures

### Basic Restore

⚠️ **WARNING:** This will overwrite your current database!

```powershell
.\restore-database.ps1 -BackupFile "K:\Scoutung platform\backups\database\backup_scouting_platform_2025-12-31_14-30-00.sql.gz"
```

The script will:
1. ✅ Create safety backup of current database
2. ✅ Decompress backup file
3. ✅ Restore database from backup
4. ✅ Verify restore integrity
5. ✅ Clean up temporary files

### Restore Options

**Skip confirmation prompt:**
```powershell
.\restore-database.ps1 -BackupFile "path\to\backup.sql.gz" -Force
```

**Drop and recreate database:**
```powershell
.\restore-database.ps1 -BackupFile "path\to\backup.sql.gz" -CreateNew
```

**Interactive restore (recommended):**
```powershell
.\manage-backups.ps1
# Select option 3: Restore from backup
```

### Restore From Safety Backup

If a restore goes wrong, recover from the safety backup:

```powershell
# Safety backups are created automatically before each restore
.\restore-database.ps1 -BackupFile "K:\Scoutung platform\backups\safety\safety_backup_2025-12-31_14-45-00.sql"
```

---

## ⏰ Automated Backups

### Windows Task Scheduler Setup

#### Method 1: PowerShell Setup (Recommended)

```powershell
# Run this to create the scheduled task automatically
# (See TASK_SCHEDULER_SETUP.md for the complete script)

# Or manually create the task:
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"K:\Scoutung platform\central-backend\scripts\backup-database.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable

Register-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Daily database backup for Scouting Platform"
```

#### Method 2: Manual GUI Setup

1. **Open Task Scheduler**
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create New Task**
   - Click "Create Task" (not "Create Basic Task")
   - Name: `ScoutingPlatform-DatabaseBackup`
   - Description: `Daily automated database backup`
   - Select "Run whether user is logged on or not"
   - Check "Run with highest privileges"

3. **Configure Trigger**
   - New Trigger → Daily
   - Start time: `2:00 AM`
   - Repeat: Every 1 day
   - Enable: ✅

4. **Configure Action**
   - Action: Start a program
   - Program: `PowerShell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "K:\Scoutung platform\central-backend\scripts\backup-database.ps1"`
   - Start in: `K:\Scoutung platform\central-backend\scripts`

5. **Configure Settings**
   - ✅ Allow task to run on demand
   - ✅ Run task as soon as possible if missed
   - ✅ Stop task if runs longer than: 1 hour
   - If running task fails, restart every: 10 minutes
   - Attempt restart up to: 3 times

### Verify Scheduled Task

```powershell
# Check if task exists
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Run task manually to test
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# View task history
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo
```

### Backup Monitoring

Create a simple monitoring script:

```powershell
# check-backup-status.ps1
$BackupDir = "K:\Scoutung platform\backups\database"
$LatestBackup = Get-ChildItem $BackupDir -Filter "backup_*.sql.*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($LatestBackup) {
    $Age = (Get-Date) - $LatestBackup.LastWriteTime
    if ($Age.TotalHours -gt 26) {
        Write-Host "⚠️ WARNING: Latest backup is $([math]::Round($Age.TotalHours, 1)) hours old!" -ForegroundColor Red
    } else {
        Write-Host "✅ Latest backup: $($LatestBackup.Name) ($([math]::Round($Age.TotalHours, 1)) hours ago)" -ForegroundColor Green
    }
} else {
    Write-Host "❌ ERROR: No backups found!" -ForegroundColor Red
}
```

---

## 🚨 Disaster Recovery

### Scenario 1: Database Corruption

**Symptoms:** Application errors, data inconsistency, PostgreSQL crashes

**Recovery Steps:**
1. Stop all services accessing the database
2. Identify the last good backup:
   ```powershell
   .\manage-backups.ps1
   # Select option 1: List all backups
   ```
3. Restore from backup:
   ```powershell
   .\restore-database.ps1 -BackupFile "path\to\last_good_backup.sql.gz" -CreateNew
   ```
4. Restart services
5. Verify data integrity

### Scenario 2: Accidental Data Deletion

**Symptoms:** User data, subscriptions, or payments missing

**Recovery Steps:**
1. Create immediate backup of current state (for forensics):
   ```powershell
   .\backup-database.ps1
   ```
2. Identify backup before deletion:
   ```powershell
   .\manage-backups.ps1
   # Select option 1: List all backups
   # Note the timestamp before the incident
   ```
3. Restore from backup:
   ```powershell
   .\restore-database.ps1 -BackupFile "path\to\backup_before_deletion.sql.gz"
   ```

### Scenario 3: Server Hardware Failure

**Symptoms:** Server won't boot, disk failure

**Recovery Steps:**
1. **If backups are on the same disk:**
   - Attempt to mount disk on another machine
   - Copy backup directory to safe location
   
2. **Set up new server:**
   - Install PostgreSQL
   - Install platform dependencies
   - Copy `.env` configuration
   
3. **Restore database:**
   ```powershell
   # On new server
   .\restore-database.ps1 -BackupFile "path\to\latest_backup.sql.gz" -CreateNew
   ```

4. **Verify restoration:**
   ```powershell
   # Check database is accessible
   psql -h localhost -U postgres -d scouting_platform -c "SELECT COUNT(*) FROM users;"
   ```

### Scenario 4: Complete Platform Loss

**Prerequisites:**
- ✅ Offsite backup copies (recommended: cloud storage, external drive)
- ✅ Configuration files backed up (`.env`, `docker-compose.yml`)

**Recovery Steps:**
1. Reinstall platform from source code
2. Restore configuration files
3. Restore database from offsite backup
4. Test all services
5. Restore any uploaded media files

---

## 🔧 Troubleshooting

### Issue: "pg_dump: command not found"

**Cause:** PostgreSQL bin directory not in PATH

**Solution:**
```powershell
# Add PostgreSQL to PATH
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"

# Or set permanently (requires admin):
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PostgreSQL\15\bin", "Machine")
```

### Issue: Backup fails with "permission denied"

**Cause:** Insufficient database permissions or directory permissions

**Solutions:**
1. Check database user has backup permissions:
   ```sql
   -- Connect as postgres superuser
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_backup_user;
   ```

2. Check directory write permissions:
   ```powershell
   Test-Path "K:\Scoutung platform\backups" -PathType Container
   New-Item -ItemType Directory -Path "K:\Scoutung platform\backups" -Force
   ```

### Issue: "connection refused" during backup

**Cause:** PostgreSQL service not running

**Solution:**
```powershell
# Check PostgreSQL service status
Get-Service -Name postgresql*

# Start service if stopped
Start-Service -Name "postgresql-x64-15"  # Adjust version number
```

### Issue: Backup file is too large

**Solutions:**
1. Ensure compression is enabled:
   ```powershell
   # Install 7-Zip for better compression
   winget install 7zip.7zip
   ```

2. Implement incremental backups (future enhancement)

3. Archive old data before backup

### Issue: Restore takes too long

**Cause:** Large database, slow disk I/O

**Solutions:**
1. Temporarily disable foreign key checks (automatically handled by script)
2. Use faster storage for restore operations
3. Consider parallel restore (future enhancement)

### Issue: "database is being accessed by other users"

**Cause:** Active connections to database during restore

**Solution:**
```powershell
# Terminate all connections (use with caution!)
psql -h localhost -U postgres -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'scouting_platform' AND pid <> pg_backend_pid();"
```

---

## ✅ Best Practices

### 1. Regular Testing
- Test restore procedures monthly
- Verify backup integrity weekly
- Document restore time for your database size

### 2. 3-2-1 Backup Strategy
- **3** copies of your data
- **2** different storage types
- **1** copy offsite

**Implementation:**
```
1. Production database (live)
2. Local automated backups (K:\Scoutung platform\backups)
3. Offsite backup (cloud storage or external drive)
```

### 3. Monitoring
- Check backup logs daily
- Alert if backup older than 26 hours
- Monitor disk space usage

```powershell
# Add to daily monitoring script
.\check-backup-status.ps1
```

### 4. Security
- Encrypt backup files containing sensitive data
- Restrict access to backup directory
- Secure database credentials in `.env`

```powershell
# Set restrictive permissions on backup directory
$acl = Get-Acl "K:\Scoutung platform\backups"
$acl.SetAccessRuleProtection($true, $false)
# Add only necessary users
Set-Acl "K:\Scoutung platform\backups" $acl
```

### 5. Documentation
- Document all restores performed
- Keep changelog of database schema changes
- Record Recovery Time Objective (RTO) and Recovery Point Objective (RPO)

**Recommended Values:**
- **RPO:** 24 hours (daily backups)
- **RTO:** 1 hour (time to restore database)

### 6. Retention Policy
- Keep daily backups for 30 days
- Keep weekly backups for 3 months
- Keep monthly backups for 1 year

```powershell
# Implement tiered retention (future enhancement)
# Current: 30-day rolling retention
```

---

## 📞 Support

### Emergency Contacts
- **Database Administrator:** [Your contact]
- **System Administrator:** [Your contact]
- **On-Call Engineer:** [Your contact]

### Useful Commands

```powershell
# Quick health check
psql -h localhost -U postgres -d scouting_platform -c "SELECT version();"

# Check database size
psql -h localhost -U postgres -d scouting_platform -c "SELECT pg_size_pretty(pg_database_size('scouting_platform'));"

# View active connections
psql -h localhost -U postgres -d scouting_platform -c "SELECT count(*) FROM pg_stat_activity;"

# Check backup status
.\check-backup-status.ps1

# List all backups
Get-ChildItem "K:\Scoutung platform\backups\database" | Sort-Object LastWriteTime -Descending
```

---

## 📚 Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [Windows Task Scheduler Documentation](https://docs.microsoft.com/en-us/windows/win32/taskschd/task-scheduler-start-page)
- [Disaster Recovery Planning Guide](https://www.postgresql.org/docs/current/backup-dump.html)

---

**Last Updated:** December 31, 2025  
**Version:** 1.0  
**Maintainer:** Scouting Platform Team
