# Server scripts

| Script | Purpose |
|--------|---------|
| `backup_kulu.sh` | DB + storage + env snapshot |
| `restore_backup.sh` | Restore from `kulu_*.tar.gz` (asks YES) |
| `test_chapa_webhook.sh` | Smoke-test Chapa webhook URL |

```bash
export KULU_CORE=$HOME/kulu_core
export BACKUP_DIR=$HOME/backups/kulu
bash backup_kulu.sh

bash restore_backup.sh $BACKUP_DIR/kulu_YYYYMMDD_HHMMSS.tar.gz

export API_BASE=https://api.yourdomain.com/api
export TX_REF=...
bash test_chapa_webhook.sh
```
