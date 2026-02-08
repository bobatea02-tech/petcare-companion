"""
Encryption utilities for sensitive data storage.
Implements industry-standard encryption for PII and medical data.
"""

import os
import base64
from typing import Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import logging

from app.core.config import settings


logger = logging.getLogger(__name__)


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""
    
    def __init__(self):
        """Initialize encryption service with key management."""
        self._encryption_key = self._load_or_generate_key()
        self._fernet = Fernet(self._encryption_key)
    
    def _load_or_generate_key(self) -> bytes:
        """Load encryption key from file or generate new one."""
        key_file = "file_encryption.key"
        
        if os.path.exists(key_file):
            with open(key_file, "rb") as f:
                key = f.read()
                logger.info("Loaded existing encryption key")
                return key
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_file, "wb") as f:
                f.write(key)
            logger.info("Generated new encryption key")
            return key
    
    def encrypt_string(self, plaintext: str) -> str:
        """
        Encrypt a string value.
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return plaintext
        
        try:
            encrypted_bytes = self._fernet.encrypt(plaintext.encode('utf-8'))
            return base64.b64encode(encrypted_bytes).decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise ValueError("Failed to encrypt data")
    
    def decrypt_string(self, encrypted_text: str) -> str:
        """
        Decrypt an encrypted string value.
        
        Args:
            encrypted_text: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string
        """
        if not encrypted_text:
            return encrypted_text
        
        try:
            encrypted_bytes = base64.b64decode(encrypted_text.encode('utf-8'))
            decrypted_bytes = self._fernet.decrypt(encrypted_bytes)
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise ValueError("Failed to decrypt data")
    
    def encrypt_file(self, file_path: str, output_path: Optional[str] = None) -> str:
        """
        Encrypt a file.
        
        Args:
            file_path: Path to file to encrypt
            output_path: Optional output path (defaults to file_path + .encrypted)
            
        Returns:
            Path to encrypted file
        """
        if output_path is None:
            output_path = file_path + ".encrypted"
        
        try:
            with open(file_path, "rb") as f:
                file_data = f.read()
            
            encrypted_data = self._fernet.encrypt(file_data)
            
            with open(output_path, "wb") as f:
                f.write(encrypted_data)
            
            logger.info(f"File encrypted: {file_path} -> {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"File encryption failed: {str(e)}")
            raise ValueError("Failed to encrypt file")
    
    def decrypt_file(self, encrypted_path: str, output_path: Optional[str] = None) -> str:
        """
        Decrypt an encrypted file.
        
        Args:
            encrypted_path: Path to encrypted file
            output_path: Optional output path (defaults to removing .encrypted extension)
            
        Returns:
            Path to decrypted file
        """
        if output_path is None:
            output_path = encrypted_path.replace(".encrypted", "")
        
        try:
            with open(encrypted_path, "rb") as f:
                encrypted_data = f.read()
            
            decrypted_data = self._fernet.decrypt(encrypted_data)
            
            with open(output_path, "wb") as f:
                f.write(decrypted_data)
            
            logger.info(f"File decrypted: {encrypted_path} -> {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"File decryption failed: {str(e)}")
            raise ValueError("Failed to decrypt file")
    
    def encrypt_bytes(self, data: bytes) -> bytes:
        """
        Encrypt raw bytes.
        
        Args:
            data: Bytes to encrypt
            
        Returns:
            Encrypted bytes
        """
        try:
            return self._fernet.encrypt(data)
        except Exception as e:
            logger.error(f"Bytes encryption failed: {str(e)}")
            raise ValueError("Failed to encrypt bytes")
    
    def decrypt_bytes(self, encrypted_data: bytes) -> bytes:
        """
        Decrypt encrypted bytes.
        
        Args:
            encrypted_data: Encrypted bytes
            
        Returns:
            Decrypted bytes
        """
        try:
            return self._fernet.decrypt(encrypted_data)
        except Exception as e:
            logger.error(f"Bytes decryption failed: {str(e)}")
            raise ValueError("Failed to decrypt bytes")


# Global encryption service instance
encryption_service = EncryptionService()


def encrypt_sensitive_field(value: Optional[str]) -> Optional[str]:
    """
    Encrypt a sensitive field value.
    
    Args:
        value: Value to encrypt
        
    Returns:
        Encrypted value or None if input is None
    """
    if value is None:
        return None
    return encryption_service.encrypt_string(value)


def decrypt_sensitive_field(encrypted_value: Optional[str]) -> Optional[str]:
    """
    Decrypt a sensitive field value.
    
    Args:
        encrypted_value: Encrypted value
        
    Returns:
        Decrypted value or None if input is None
    """
    if encrypted_value is None:
        return None
    return encryption_service.decrypt_string(encrypted_value)


def hash_sensitive_identifier(value: str, salt: Optional[bytes] = None) -> str:
    """
    Create a one-way hash of a sensitive identifier (e.g., for indexing).
    
    Args:
        value: Value to hash
        salt: Optional salt (generated if not provided)
        
    Returns:
        Base64-encoded hash
    """
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    
    key = kdf.derive(value.encode('utf-8'))
    return base64.b64encode(salt + key).decode('utf-8')
