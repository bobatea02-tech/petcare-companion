"""
Secrets management integration for production deployments.
Supports AWS Secrets Manager, Azure Key Vault, and environment variables.
"""

import os
import json
import logging
from typing import Dict, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)


class SecretsManager:
    """Unified secrets management interface."""
    
    def __init__(self, provider: str = "env"):
        """
        Initialize secrets manager.
        
        Args:
            provider: Secrets provider (env, aws, azure)
        """
        self.provider = provider.lower()
        self._client = None
        
        if self.provider == "aws":
            self._init_aws()
        elif self.provider == "azure":
            self._init_azure()
        elif self.provider != "env":
            raise ValueError(f"Unsupported secrets provider: {provider}")
    
    def _init_aws(self):
        """Initialize AWS Secrets Manager client."""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            self._client = boto3.client('secretsmanager')
            self._client_error = ClientError
            logger.info("AWS Secrets Manager initialized")
        except ImportError:
            logger.error("boto3 not installed. Install with: pip install boto3")
            raise
    
    def _init_azure(self):
        """Initialize Azure Key Vault client."""
        try:
            from azure.keyvault.secrets import SecretClient
            from azure.identity import DefaultAzureCredential
            
            vault_url = os.getenv("AZURE_KEY_VAULT_URL")
            if not vault_url:
                raise ValueError("AZURE_KEY_VAULT_URL environment variable required")
            
            credential = DefaultAzureCredential()
            self._client = SecretClient(vault_url=vault_url, credential=credential)
            logger.info("Azure Key Vault initialized")
        except ImportError:
            logger.error("Azure SDK not installed. Install with: pip install azure-keyvault-secrets azure-identity")
            raise
    
    @lru_cache(maxsize=128)
    def get_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get secret value from configured provider.
        
        Args:
            secret_name: Name of the secret
            default: Default value if secret not found
            
        Returns:
            Secret value or default
        """
        if self.provider == "env":
            return os.getenv(secret_name, default)
        
        elif self.provider == "aws":
            return self._get_aws_secret(secret_name, default)
        
        elif self.provider == "azure":
            return self._get_azure_secret(secret_name, default)
        
        return default
    
    def _get_aws_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from AWS Secrets Manager."""
        try:
            response = self._client.get_secret_value(SecretId=secret_name)
            
            # Secrets can be string or binary
            if 'SecretString' in response:
                secret = response['SecretString']
                # Try to parse as JSON
                try:
                    secret_dict = json.loads(secret)
                    # If it's a dict, return the first value
                    return list(secret_dict.values())[0] if secret_dict else default
                except json.JSONDecodeError:
                    return secret
            else:
                return response['SecretBinary'].decode('utf-8')
                
        except self._client_error as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                logger.warning(f"Secret not found: {secret_name}")
            else:
                logger.error(f"Error retrieving secret {secret_name}: {e}")
            return default
    
    def _get_azure_secret(self, secret_name: str, default: Optional[str] = None) -> Optional[str]:
        """Get secret from Azure Key Vault."""
        try:
            secret = self._client.get_secret(secret_name)
            return secret.value
        except Exception as e:
            logger.error(f"Error retrieving secret {secret_name}: {e}")
            return default
    
    def get_secrets_dict(self, secret_names: list) -> Dict[str, Optional[str]]:
        """
        Get multiple secrets at once.
        
        Args:
            secret_names: List of secret names
            
        Returns:
            Dictionary of secret names to values
        """
        return {name: self.get_secret(name) for name in secret_names}
    
    def set_secret(self, secret_name: str, secret_value: str) -> bool:
        """
        Set secret value (only supported for AWS and Azure).
        
        Args:
            secret_name: Name of the secret
            secret_value: Value to set
            
        Returns:
            True if successful, False otherwise
        """
        if self.provider == "env":
            logger.warning("Cannot set secrets for environment variable provider")
            return False
        
        elif self.provider == "aws":
            return self._set_aws_secret(secret_name, secret_value)
        
        elif self.provider == "azure":
            return self._set_azure_secret(secret_name, secret_value)
        
        return False
    
    def _set_aws_secret(self, secret_name: str, secret_value: str) -> bool:
        """Set secret in AWS Secrets Manager."""
        try:
            self._client.put_secret_value(
                SecretId=secret_name,
                SecretString=secret_value
            )
            logger.info(f"Secret updated: {secret_name}")
            return True
        except self._client_error as e:
            logger.error(f"Error setting secret {secret_name}: {e}")
            return False
    
    def _set_azure_secret(self, secret_name: str, secret_value: str) -> bool:
        """Set secret in Azure Key Vault."""
        try:
            self._client.set_secret(secret_name, secret_value)
            logger.info(f"Secret updated: {secret_name}")
            return True
        except Exception as e:
            logger.error(f"Error setting secret {secret_name}: {e}")
            return False


# Global secrets manager instance
_secrets_manager: Optional[SecretsManager] = None


def get_secrets_manager(provider: str = None) -> SecretsManager:
    """
    Get or create global secrets manager instance.
    
    Args:
        provider: Secrets provider (env, aws, azure). 
                 If None, uses SECRETS_PROVIDER env var or defaults to 'env'
    
    Returns:
        SecretsManager instance
    """
    global _secrets_manager
    
    if _secrets_manager is None:
        if provider is None:
            provider = os.getenv("SECRETS_PROVIDER", "env")
        _secrets_manager = SecretsManager(provider)
    
    return _secrets_manager


def load_secrets_to_env(secret_names: list):
    """
    Load secrets from provider and set as environment variables.
    Useful for loading secrets at application startup.
    
    Args:
        secret_names: List of secret names to load
    """
    manager = get_secrets_manager()
    secrets = manager.get_secrets_dict(secret_names)
    
    for name, value in secrets.items():
        if value is not None:
            os.environ[name] = value
            logger.info(f"Loaded secret: {name}")
