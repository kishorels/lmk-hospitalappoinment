import os
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

PLAYBOOK_API_BASE = "https://www.playbook.com/api/v1"
PLAYBOOK_API_KEY = os.getenv("PLAYBOOK_API_KEY")
PLAYBOOK_WORKSPACE_SLUG = os.getenv("PLAYBOOK_WORKSPACE_SLUG")

class PlaybookStorage:
    def __init__(self):
        self.api_key = PLAYBOOK_API_KEY
        self.slug = PLAYBOOK_WORKSPACE_SLUG
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    async def prepare_upload(self, title: str, size: int, media_type: str) -> Dict[str, Any]:
        """Step 1: Request upload credentials from Playbook"""
        url = f"{PLAYBOOK_API_BASE}/{self.slug}/assets/upload_prepare"
        payload = {
            "title": title,
            "size": size,
            "media_type": media_type
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def upload_to_signed_url(self, upload_url: str, file_content: bytes, content_type: str):
        """Step 2: Upload the binary file directly to the pre-signed URL (GCS)"""
        async with httpx.AsyncClient() as client:
            response = await client.put(upload_url, content=file_content, headers={"Content-Type": content_type})
            response.raise_for_status()
            return response

    async def complete_upload(self, signed_gcs_id: str, title: str, media_type: str) -> Dict[str, Any]:
        """Step 3: Finalize the upload with Playbook"""
        url = f"{PLAYBOOK_API_BASE}/{self.slug}/assets/upload_complete"
        payload = {
            "signed_gcs_id": signed_gcs_id,
            "title": title,
            "media_type": media_type
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def get_asset(self, asset_id: str) -> Dict[str, Any]:
        """Get asset details including retrieval links"""
        url = f"{PLAYBOOK_API_BASE}/{self.slug}/assets/{asset_id}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()

# Singleton instance
storage_service = PlaybookStorage()
