# Database Backup System - Quick Reference

## 🎯 Overview

Complete automated database backup system with daily backups, 30-day retention, compression, and one-click restore.

**Backup Location:** `K:\Scoutung platform\backups\database`

---

## 🚀 Quick Start

### Create Backup Now
```powershell
cd "K:\Scoutung platform\central-backend\scripts"
.\backup-database.ps1
```

### Restore From Backup
```powershell
.\manage-backups.ps1
# Select option 3: Restore from backup
```

### Setup Automated Daily Backups
```powershell
# Run as Administrator
.\setup-scheduled-backup.ps1
```

---

## 📁 Files Created

### Scripts
- **`scripts/backup-database.ps1`** - Main backup script with compression
- **`scripts/restore-database.ps1`** - Database restore with safety checks
- **`scripts/manage-backups.ps1`** - Interactive backup management UI
- **`scripts/setup-scheduled-backup.ps1`** - Auto-configure Windows Task Scheduler
- **`scripts/backup.config`** - Backup configuration settings

### Documentation
- **`DATABASE_BACKUP_GUIDE.md`** - Complete backup/restore guide with disaster recovery
- **`TASK_SCHEDULER_SETUP.md`** - Windows Task Scheduler setup instructions
- **`DATABASE_BACKUP_QUICK_START.md`** - This quick reference

---

## 📦 Features

✅ **Automated Daily Backups** (2:00 AM)  
✅ **Compression** (saves ~70% disk space)  
✅ **30-Day Retention** (automatic cleanup)  
✅ **Safety Backups** (before restore operations)  
✅ **Interactive Management** (list, create, restore, delete)  
✅ **Integrity Testing** (verify backup files)  
✅ **Disaster Recovery** (documented procedures)  
✅ **One-Click Restore** (with confirmation)

---

## 🔧 Common Tasks

### List All Backups
```powershell
.\manage-backups.ps1
# Select option 1: List all backups
```

### View Backup Statistics
```powershell
.\manage-backups.ps1
# Select option 5: View backup statistics
```

### Test Backup Integrity
```powershell
.\manage-backups.ps1
# Select option 6: Test backup integrity
```

### Delete Old Backups Manually
```powershell
.\manage-backups.ps1
# Select option 4: Delete old backups
```

---

## ⚙️ Configuration

Edit `scripts/backup.config`:

```ini
# Retention period (days)
RETENTION_DAYS=30

# Backup directory
BACKUP_DIR=K:\Scoutung platform\backups\database

# Enable compression
COMPRESSION_ENABLED=true
```

---

## 📊 Monitoring

### Check Backup Status
```powershell
Get-ChildItem "K:\Scoutung platform\backups\database" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 5 Name, @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}, LastWriteTime
```

### Check Scheduled Task
```powershell
# View task status
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup" | Get-ScheduledTaskInfo

# Run task now (test)
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"
```

---

## 🚨 Emergency Restore

If you need to restore immediately:

```powershell
# 1. List recent backups
Get-ChildItem "K:\Scoutung platform\backups\database" | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# 2. Restore from latest backup
.\restore-database.ps1 -BackupFile "K:\Scoutung platform\backups\database\backup_scouting_platform_2025-12-31_14-30-00.sql.gz" -Force
```

---

## 📖 Full Documentation

- **Complete Guide:** [DATABASE_BACKUP_GUIDE.md](./DATABASE_BACKUP_GUIDE.md)
- **Scheduler Setup:** [TASK_SCHEDULER_SETUP.md](./TASK_SCHEDULER_SETUP.md)

---

## ✅ Setup Checklist

After installation:

- [ ] Run test backup: `.\backup-database.ps1`
- [ ] Verify backup file created in `backups/database/`
- [ ] Setup automated backups: `.\setup-scheduled-backup.ps1` (as Admin)
- [ ] Verify scheduled task exists in Task Scheduler
- [ ] Test restore on a copy of the database
- [ ] Document backup recovery time
- [ ] Set up offsite backup copy (cloud storage)
- [ ] Schedule monthly restore tests

---

## 💡 Best Practices

1. **Test restores monthly** to ensure backups are valid
2. **Keep offsite copies** for disaster recovery
3. **Monitor disk space** in backup directory
4. **Review backup logs** regularly
5. **Document any manual restores** performed

---

## 📞 Quick Reference Commands

```powershell
# Backup now
.\backup-database.ps1

# Interactive management
.\manage-backups.ps1

# Restore (interactive)
.\manage-backups.ps1  # Option 3

# Restore (direct)
.\restore-database.ps1 -BackupFile "path\to\backup.sql.gz"

# Setup automation (run as Admin)
.\setup-scheduled-backup.ps1

# Check scheduled task
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Run scheduled task now
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# View backup directory
explorer "K:\Scoutung platform\backups\database"
```

---

**Last Updated:** December 31, 2025  
**Version:** 1.0
