"""
Database backup script for automated backups.
Supports PostgreSQL and SQLite databases.
"""

import os
import sys
import subprocess
import logging
from datetime import datetime
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatabaseBackup:
    """Database backup manager."""
    
    def __init__(self):
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        self.timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
    def backup_postgresql(self) -> Path:
        """
        Backup PostgreSQL database using pg_dump.
        
        Returns:
            Path to backup file
        """
        logger.info("Starting PostgreSQL backup...")
        
        # Parse database URL
        db_url = settings.DATABASE_URL
        if "postgresql" not in db_url:
            raise ValueError("Not a PostgreSQL database")
        
        # Extract connection details
        # Format: postgresql+asyncpg://user:pass@host:port/dbname
        parts = db_url.replace("postgresql+asyncpg://", "").split("@")
        user_pass = parts[0].split(":")
        host_db = parts[1].split("/")
        host_port = host_db[0].split(":")
        
        user = user_pass[0]
        password = user_pass[1] if len(user_pass) > 1 else ""
        host = host_port[0]
        port = host_port[1] if len(host_port) > 1 else "5432"
        dbname = host_db[1]
        
        # Create backup filename
        backup_file = self.backup_dir / f"pawpal_backup_{self.timestamp}.sql"
        
        # Set environment variable for password
        env = os.environ.copy()
        env["PGPASSWORD"] = password
        
        # Run pg_dump
        cmd = [
            "pg_dump",
            "-h", host,
            "-p", port,
            "-U", user,
            "-d", dbname,
            "-F", "c",  # Custom format (compressed)
            "-f", str(backup_file)
        ]
        
        try:
            subprocess.run(cmd, env=env, check=True, capture_output=True)
            logger.info(f"PostgreSQL backup created: {backup_file}")
            return backup_file
        except subprocess.CalledProcessError as e:
            logger.error(f"PostgreSQL backup failed: {e.stderr.decode()}")
            raise
    
    def backup_sqlite(self) -> Path:
        """
        Backup SQLite database by copying the file.
        
        Returns:
            Path to backup file
        """
        logger.info("Starting SQLite backup...")
        
        # Extract database file path
        db_url = settings.DATABASE_URL
        if "sqlite" not in db_url:
            raise ValueError("Not a SQLite database")
        
        # Format: sqlite+aiosqlite:///./pawpal.db
        db_file = db_url.replace("sqlite+aiosqlite:///", "")
        db_path = Path(db_file)
        
        if not db_path.exists():
            raise FileNotFoundError(f"Database file not found: {db_path}")
        
        # Create backup filename
        backup_file = self.backup_dir / f"pawpal_backup_{self.timestamp}.db"
        
        # Copy database file
        import shutil
        shutil.copy2(db_path, backup_file)
        
        logger.info(f"SQLite backup created: {backup_file}")
        return backup_file
    
    def upload_to_s3(self, backup_file: Path, bucket_name: str, aws_region: str = "us-east-1"):
        """
        Upload backup file to AWS S3.
        
        Args:
            backup_file: Path to backup file
            bucket_name: S3 bucket name
            aws_region: AWS region
        """
        logger.info(f"Uploading backup to S3 bucket: {bucket_name}")
        
        try:
            s3_client = boto3.client('s3', region_name=aws_region)
            
            # Upload file
            s3_key = f"backups/{backup_file.name}"
            s3_client.upload_file(
                str(backup_file),
                bucket_name,
                s3_key,
                ExtraArgs={
                    'ServerSideEncryption': 'AES256',
                    'StorageClass': 'STANDARD_IA'  # Infrequent Access for cost savings
                }
            )
            
            logger.info(f"Backup uploaded to S3: s3://{bucket_name}/{s3_key}")
            
            # Set lifecycle policy to delete old backups after 30 days
            self._set_lifecycle_policy(s3_client, bucket_name)
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise
    
    def _set_lifecycle_policy(self, s3_client, bucket_name: str):
        """Set S3 lifecycle policy to delete old backups."""
        try:
            lifecycle_policy = {
                'Rules': [
                    {
                        'Id': 'DeleteOldBackups',
                        'Status': 'Enabled',
                        'Prefix': 'backups/',
                        'Expiration': {
                            'Days': 30
                        }
                    }
                ]
            }
            
            s3_client.put_bucket_lifecycle_configuration(
                Bucket=bucket_name,
                LifecycleConfiguration=lifecycle_policy
            )
            logger.info("S3 lifecycle policy configured")
        except ClientError as e:
            logger.warning(f"Failed to set lifecycle policy: {e}")
    
    def cleanup_old_backups(self, keep_days: int = 7):
        """
        Delete local backup files older than specified days.
        
        Args:
            keep_days: Number of days to keep backups
        """
        logger.info(f"Cleaning up backups older than {keep_days} days...")
        
        cutoff_time = datetime.utcnow().timestamp() - (keep_days * 86400)
        deleted_count = 0
        
        for backup_file in self.backup_dir.glob("pawpal_backup_*"):
            if backup_file.stat().st_mtime < cutoff_time:
                backup_file.unlink()
                deleted_count += 1
                logger.info(f"Deleted old backup: {backup_file}")
        
        logger.info(f"Cleaned up {deleted_count} old backup(s)")
    
    def run(self, upload_s3: bool = False, s3_bucket: str = None, cleanup: bool = True):
        """
        Run complete backup process.
        
        Args:
            upload_s3: Whether to upload to S3
            s3_bucket: S3 bucket name (required if upload_s3=True)
            cleanup: Whether to cleanup old local backups
        """
        try:
            # Determine database type and backup
            if "postgresql" in settings.DATABASE_URL:
                backup_file = self.backup_postgresql()
            elif "sqlite" in settings.DATABASE_URL:
                backup_file = self.backup_sqlite()
            else:
                raise ValueError("Unsupported database type")
            
            # Upload to S3 if requested
            if upload_s3:
                if not s3_bucket:
                    raise ValueError("S3 bucket name required for upload")
                self.upload_to_s3(backup_file, s3_bucket)
            
            # Cleanup old backups
            if cleanup:
                self.cleanup_old_backups()
            
            logger.info("Backup process completed successfully")
            return backup_file
            
        except Exception as e:
            logger.error(f"Backup process failed: {e}")
            raise


def main():
    """Main entry point for backup script."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Backup PawPal database")
    parser.add_argument("--s3", action="store_true", help="Upload backup to S3")
    parser.add_argument("--bucket", type=str, help="S3 bucket name")
    parser.add_argument("--no-cleanup", action="store_true", help="Skip cleanup of old backups")
    
    args = parser.parse_args()
    
    backup = DatabaseBackup()
    backup.run(
        upload_s3=args.s3,
        s3_bucket=args.bucket,
        cleanup=not args.no_cleanup
    )


if __name__ == "__main__":
    main()
