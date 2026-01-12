# Database Backup Scripts

This directory contains all scripts for automated database backup and restore operations.

## 📋 Quick Reference

### Create Backup
```powershell
.\backup-database.ps1
```

### Restore Database
```powershell
.\restore-database.ps1 -BackupFile "path\to\backup.sql.gz"
```

### Interactive Management
```powershell
.\manage-backups.ps1
```

### Setup Automation (Run as Admin)
```powershell
.\setup-scheduled-backup.ps1
```

### Health Check
```powershell
.\check-backup-health.ps1
```

---

## 📁 Files

| File | Purpose |
|------|---------|
| `backup-database.ps1` | Main backup script with compression |
| `restore-database.ps1` | Database restore with safety checks |
| `manage-backups.ps1` | Interactive menu for backup management |
| `setup-scheduled-backup.ps1` | Automated Task Scheduler setup |
| `check-backup-health.ps1` | System health monitoring |
| `backup.config` | Configuration settings |
| `README.md` | This file |

---

## 📚 Documentation

- **Quick Start:** [../DATABASE_BACKUP_QUICK_START.md](../DATABASE_BACKUP_QUICK_START.md)
- **Complete Guide:** [../DATABASE_BACKUP_GUIDE.md](../DATABASE_BACKUP_GUIDE.md)
- **Task Scheduler:** [../TASK_SCHEDULER_SETUP.md](../TASK_SCHEDULER_SETUP.md)
- **Implementation:** [../DATABASE_BACKUP_IMPLEMENTATION.md](../DATABASE_BACKUP_IMPLEMENTATION.md)

---

## 🎯 First Time Setup

1. **Test backup manually:**
   ```powershell
   .\backup-database.ps1
   ```

2. **Setup daily automation (as Administrator):**
   ```powershell
   .\setup-scheduled-backup.ps1
   ```

3. **Verify everything works:**
   ```powershell
   .\check-backup-health.ps1
   ```

Done! Backups now run automatically every day at 2:00 AM.

---

## ⚠️ Important Notes

- **Administrator required** only for `setup-scheduled-backup.ps1`
- All other scripts run with normal user privileges
- Database credentials loaded from `../.env` file
- Backups stored in: `K:\Scoutung platform\backups\database`
- Retention: 30 days (automatic cleanup)

---

## 🆘 Troubleshooting

### "pg_dump: command not found"
Add PostgreSQL to PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\15\bin"
```

### "Permission denied"
- For setup: Run PowerShell as Administrator
- For backups: Check database user permissions

### Scheduled task not running
```powershell
# Check status
Get-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"

# Run manually to test
Start-ScheduledTask -TaskName "ScoutingPlatform-DatabaseBackup"
```

See [../DATABASE_BACKUP_GUIDE.md](../DATABASE_BACKUP_GUIDE.md) for complete troubleshooting.

---

**Version:** 1.0  
**Last Updated:** 2025-12-31
