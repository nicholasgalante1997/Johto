# Troubleshooting

Common issues and their solutions for the Pokemon TCG Cron Service.

## Quick Diagnostics

Run these commands to diagnose issues:

```bash
# Check service status
bun run job:status

# Run health check
bun run job:run database-health-check

# Check logs (Docker)
docker logs pokemon-cron --tail 100

# Verify database
sqlite3 ./database/pokemon-data.sqlite3.db "PRAGMA integrity_check;"
```

## Common Issues

### Service Won't Start

**Symptom:** Service crashes immediately on startup.

**Possible Causes:**

1. **Missing database file**

   ```bash
   # Check if database exists
   ls -la ./database/pokemon-data.sqlite3.db

   # Create directory if missing
   mkdir -p ./database
   ```

2. **Invalid configuration**

   ```bash
   # Validate environment
   bun run src/cli.ts status

   # Check for syntax errors
   bun run typecheck
   ```

3. **Permission issues**
   ```bash
   # Fix permissions
   chmod 755 ./database
   chmod 644 ./database/*.db
   ```

---

### Jobs Not Running

**Symptom:** Scheduled jobs don't execute at expected times.

**Possible Causes:**

1. **Timezone mismatch**

   ```bash
   # Check configured timezone
   echo $CRON_TIMEZONE

   # Verify system time
   date

   # Set correct timezone
   export CRON_TIMEZONE=America/New_York
   ```

2. **Dependency not met**

   ```bash
   # Check job dependencies
   bun run job:status sync-missing-cards

   # Run dependency first
   bun run job:run sync-missing-sets
   ```

3. **Max concurrent jobs reached**

   ```bash
   # Check running jobs
   bun run job:status

   # If jobs are stuck, restart service
   docker restart pokemon-cron
   ```

---

### Database Connection Failed

**Symptom:** Jobs fail with "database connection" errors.

**SQLite Issues:**

```bash
# Check file exists and is readable
ls -la ./database/pokemon-data.sqlite3.db

# Check for corruption
sqlite3 ./database/pokemon-data.sqlite3.db "PRAGMA integrity_check;"

# Check for lock file
ls -la ./database/pokemon-data.sqlite3.db-*

# Remove stale lock (if service is stopped)
rm ./database/pokemon-data.sqlite3.db-wal
rm ./database/pokemon-data.sqlite3.db-shm
```

**PostgreSQL Issues:**

```bash
# Test connection
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;"

# Check environment variables
env | grep POSTGRES

# Verify network connectivity
ping $POSTGRES_HOST
```

---

### Backup Failures

**Symptom:** `backup-database` job fails.

**Possible Causes:**

1. **Disk full**

   ```bash
   # Check disk space
   df -h ./database

   # Clean old backups manually
   ls -la ./database/backups/
   rm ./database/backups/old-backup.gz
   ```

2. **Permission denied**

   ```bash
   # Fix backup directory permissions
   mkdir -p ./database/backups
   chmod 755 ./database/backups
   ```

3. **Database locked**

   ```bash
   # Check for active connections
   lsof ./database/pokemon-data.sqlite3.db

   # Stop other processes using the database
   ```

---

### Sync Jobs Failing

**Symptom:** `sync-missing-sets` or `sync-missing-cards` fails.

**Possible Causes:**

1. **Data source missing**

   ```bash
   # Check if @pokemon/data is installed
   ls -la node_modules/@pokemon/data

   # Reinstall dependencies
   bun install
   ```

2. **Database schema mismatch**

   ```bash
   # Check table structure
   sqlite3 ./database/pokemon-data.sqlite3.db ".schema sets"
   sqlite3 ./database/pokemon-data.sqlite3.db ".schema pokemon_cards"
   ```

3. **Timeout exceeded**
   ```bash
   # Run with extended timeout
   SYNC_TIMEOUT=3600000 bun run job:run sync-missing-cards
   ```

---

### Health Check Failing

**Symptom:** `database-health-check` reports low score or fails.

**Diagnosis:**

```bash
# Run health check with debug logging
CRON_LOG_LEVEL=debug bun run job:run database-health-check
```

**Common Issues:**

| Issue                    | Solution                              |
| ------------------------ | ------------------------------------- |
| SQLite connection failed | Check file permissions and path       |
| Integrity check failed   | Restore from backup                   |
| Database too large       | Run cleanup job                       |
| WAL file too large       | Run `PRAGMA wal_checkpoint(TRUNCATE)` |
| PostgreSQL unavailable   | Check connection settings             |

---

### Notifications Not Sending

**Symptom:** Slack alerts not arriving.

**Diagnosis:**

```bash
# Verify webhook URL is set
echo $NOTIFICATION_WEBHOOK_URL

# Test webhook manually
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from cron service"}' \
  "$NOTIFICATION_WEBHOOK_URL"

# Check minimum severity
echo $NOTIFICATION_MIN_SEVERITY
```

**Solutions:**

1. Verify webhook URL is correct
2. Check Slack app permissions
3. Lower minimum severity: `NOTIFICATION_MIN_SEVERITY=info`
4. Check for network/firewall issues

---

### Memory Issues

**Symptom:** Service crashes with out-of-memory errors.

**Diagnosis:**

```bash
# Check memory usage
docker stats pokemon-cron

# Check for memory leaks in logs
docker logs pokemon-cron | grep -i "memory\|heap"
```

**Solutions:**

1. **Reduce batch sizes**

   ```bash
   export SYNC_BATCH_SIZE=50
   ```

2. **Set memory limits in Docker**

   ```yaml
   services:
     cron:
       deploy:
         resources:
           limits:
             memory: 512M
   ```

3. **Run garbage collection**
   Jobs should complete and release memory. If not, restart the service.

---

### Job Timeout

**Symptom:** Job fails with "timeout" error.

**Diagnosis:**

```bash
# Check job duration
bun run job:status <job-name>

# View metrics from last run
bun run job:status <job-name> | grep duration
```

**Solutions:**

1. **Increase timeout** in job configuration
2. **Reduce batch size** for faster iterations
3. **Check for slow queries**
   ```bash
   CRON_LOG_LEVEL=debug bun run job:run <job-name>
   ```

---

## Recovery Procedures

### Restore from Backup

```bash
# 1. Stop the service
docker compose stop cron

# 2. List available backups
ls -la ./database/backups/

# 3. Decompress backup
gunzip -k ./database/backups/pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db.gz

# 4. Replace database
mv ./database/pokemon-data.sqlite3.db ./database/pokemon-data.sqlite3.db.corrupted
mv ./database/backups/pokemon-data-2025-01-15T00-00-00.000Z.sqlite3.db ./database/pokemon-data.sqlite3.db

# 5. Restart service
docker compose start cron

# 6. Verify
bun run job:run database-health-check
```

### Reset Scheduler State

```bash
# Stop service
docker compose stop cron

# Clear any state (if applicable)
# Note: This service uses in-memory state, restart clears it

# Restart
docker compose start cron
```

### Force Re-sync

```bash
# Run sync jobs in order
bun run job:run sync-missing-sets
bun run job:run sync-missing-cards
bun run job:run replicate-to-primary
```

---

## Debug Mode

Enable verbose logging for debugging:

```bash
# Set debug log level
export CRON_LOG_LEVEL=debug

# Run specific job
bun run job:run <job-name>

# Or run the whole service
bun run start
```

### Debug Output Example

```
[DEBUG] [scheduler] Tick at 2025-01-15T14:30:00.000Z
[DEBUG] [scheduler] Evaluating job: sync-missing-sets
[DEBUG] [scheduler] Schedule: 0 2 * * *
[DEBUG] [scheduler] Current time matches: false
[DEBUG] [scheduler] Evaluating job: database-health-check
[DEBUG] [scheduler] Schedule: */15 * * * *
[DEBUG] [scheduler] Current time matches: true
[DEBUG] [scheduler] Starting job: database-health-check
[DEBUG] [database-health-check] SQLite path: ./database/pokemon-data.sqlite3.db
[DEBUG] [database-health-check] Executing: SELECT 1
[DEBUG] [database-health-check] Result: OK
```

---

## Getting Help

### Log Collection

When reporting issues, include:

```bash
# System info
uname -a
bun --version
node --version

# Service logs
docker logs pokemon-cron --tail 500 > cron-logs.txt

# Health check output
bun run job:run database-health-check > health-check.txt 2>&1

# Job status
bun run job:list > jobs.txt
bun run job:status > status.txt
```

### Common Log Patterns

| Pattern           | Meaning              |
| ----------------- | -------------------- |
| `[ERROR]`         | Something failed     |
| `[WARN]`          | Potential issue      |
| `JobTimeoutError` | Job exceeded timeout |
| `DependencyError` | Missing dependency   |
| `SQLITE_BUSY`     | Database locked      |
| `ECONNREFUSED`    | Connection refused   |

### Contact

- Check documentation first
- Search existing issues
- Report at: https://github.com/anthropics/claude-code/issues
