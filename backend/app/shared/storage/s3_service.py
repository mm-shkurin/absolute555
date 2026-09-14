import asyncio

from botocore.exceptions import BotoCoreError, ClientError

from loguru import logger

from app.core.config_getters import get_minio_settings
from app.shared.storage.s3_bucket import (
    build_client,
    ensure_bucket_exists,
    generate_key,
    public_base_url,
)
from app.shared.storage.s3_urls import public_photo_url


class S3Service:
    def __init__(self):
        settings = get_minio_settings()
        self.s3_client = build_client(settings)
        self.bucket = settings.minio_bucket_name
        self.documents_bucket = settings.minio_documents_bucket
        self.base_url = public_base_url(settings)
        ensure_bucket_exists(self.s3_client, self.bucket, public=True)
        ensure_bucket_exists(self.s3_client, self.documents_bucket, public=False)

    async def put_public(
        self, owner_id: str, body: bytes, content_type: str, folder: str = "photos"
    ) -> str:
        """Store an image in the public gallery bucket and return its key."""
        key = generate_key(owner_id, None, folder)
        await self._run(
            lambda: self.s3_client.put_object(
                Bucket=self.bucket, Key=key, Body=body,
                ACL="public-read", ContentType=content_type,
            )
        )
        return key

    async def put_document(self, listing_id: str, body: bytes, content_type: str) -> str:
        """Store a document in the closed bucket. No public-read ACL: that is the point."""
        key = generate_key(listing_id, None, "sts")
        await self._run(
            lambda: self.s3_client.put_object(
                Bucket=self.documents_bucket, Key=key, Body=body, ContentType=content_type
            )
        )
        return key

    def get_public_photo_url(self, key: str) -> str:
        return public_photo_url(get_minio_settings(), key)

    async def sign_document_url(self, key: str, expires_in: int) -> str:
        return await self._run(
            lambda: self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.documents_bucket, "Key": key},
                ExpiresIn=expires_in,
            )
        )

    async def get_document(self, key: str) -> bytes:
        response = await self._run(
            lambda: self.s3_client.get_object(Bucket=self.documents_bucket, Key=key)
        )
        return response["Body"].read()

    async def delete_document(self, key: str) -> None:
        await self._run(
            lambda: self.s3_client.delete_object(Bucket=self.documents_bucket, Key=key)
        )

    async def delete_file(self, key: str) -> bool:
        try:
            await self._run(lambda: self.s3_client.delete_object(Bucket=self.bucket, Key=key))
            return True
        except (BotoCoreError, ClientError) as e:
            logger.error(f"Error deleting file {key} from S3: {e}")
            return False

    async def delete_files(self, keys: list[str]) -> dict:
        results = {"deleted": [], "failed": []}
        for key in keys:
            success = await self.delete_file(key)
            results["deleted" if success else "failed"].append(key)
        return results

    @staticmethod
    async def _run(call):
        return await asyncio.get_running_loop().run_in_executor(None, call)


s3_service = S3Service()
