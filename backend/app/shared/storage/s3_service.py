from app.core.config import MinioSettings
import json
from fastapi import UploadFile
import asyncio
from typing import Optional

from app.shared.storage.s3_bucket import (
    build_client,
    ensure_bucket_exists,
    generate_key,
    public_base_url,
)

minio_settings = MinioSettings()


class S3Service:
    def __init__(self):
        self.s3_client = build_client(minio_settings)
        self.bucket = minio_settings.minio_bucket_name
        self.documents_bucket = minio_settings.minio_documents_bucket
        self.base_url = public_base_url(minio_settings)
        ensure_bucket_exists(self.s3_client, self.bucket, public=True)
        ensure_bucket_exists(self.s3_client, self.documents_bucket, public=False)

    async def upload_file(self, car_id: str, file: UploadFile, folder: str = "photos") -> str:
        return self.make_url(await self.upload_file_get_key(car_id, file, folder))

    def make_url(self, key: str) -> str:
        return f"{self.base_url}/{self.bucket}/{key}"

    def extract_key_from_url(self, url: str) -> str:
        prefix = f"{self.base_url}/{self.bucket}/"
        return url[len(prefix):] if url.startswith(prefix) else url

    async def upload_file_get_key(self, car_id: str, file: UploadFile, folder: str = "photos") -> str:
        key = generate_key(car_id, file.filename, folder)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.s3_client.upload_fileobj(
                file.file,
                self.bucket,
                key,
                ExtraArgs={"ACL": "public-read", "ContentType": file.content_type},
            ),
        )
        return key

    async def put_document(self, listing_id: str, body: bytes, content_type: str) -> str:
        """Store a document in the closed bucket. No public-read ACL: that is the point."""
        key = generate_key(listing_id, None, "sts")
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.s3_client.put_object(
                Bucket=self.documents_bucket, Key=key, Body=body, ContentType=content_type
            ),
        )
        return key

    async def get_document(self, key: str) -> bytes:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: self.s3_client.get_object(Bucket=self.documents_bucket, Key=key),
        )
        return response["Body"].read()

    async def sign_document_url(self, key: str, expires_in: int) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.documents_bucket, "Key": key},
                ExpiresIn=expires_in,
            ),
        )

    async def delete_document(self, key: str) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.s3_client.delete_object(Bucket=self.documents_bucket, Key=key),
        )

    async def upload_file_get_key_from_bytes(
        self,
        car_id: str,
        file_bytes: bytes,
        filename: Optional[str] = None,
        content_type: str = "image/jpeg",
        folder: str = "photos",
    ) -> str:
        url = await self.upload_file_from_bytes(
            car_id, file_bytes, filename=filename, content_type=content_type, folder=folder
        )
        return self.extract_key_from_url(url)

    async def upload_file_from_bytes(self, car_id: str, file_bytes: bytes, filename: Optional[str] = None, content_type: Optional[str] = None, folder: str = "photos") -> str:
        key = generate_key(car_id, filename, folder)

        extra_args = {"ACL": "public-read"}
        if content_type:
            extra_args["ContentType"] = content_type

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: self.s3_client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_bytes,
                **extra_args,
            ),
        )

        return f"{self.base_url}/{self.bucket}/{key}"

    async def generate_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        loop = asyncio.get_event_loop()
        url = await loop.run_in_executor(
            None,
            lambda: self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expires_in
            )
        )
        if url.startswith('http://'):
            url = url.replace('http://', 'https://')
        url = url.replace(':9000', '')
        return url

    def get_public_photo_url(self, key: str) -> str:
        # The address a browser reaches the gallery at, which is not the address this
        # process talks to MinIO on. It was hardcoded here until story 5.
        return f"{minio_settings.public_photo_base_url.rstrip('/')}/{key}"

    async def delete_file(self, key: str) -> bool:
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            )
            return True
        except Exception as e:
            print(f"Error deleting file {key} from S3: {e}")
            return False

    async def delete_files(self, keys: list[str]) -> dict:
        results = {"deleted": [], "failed": []}
        for key in keys:
            success = await self.delete_file(key)
            if success:
                results["deleted"].append(key)
            else:
                results["failed"].append(key)
        return results

s3_service = S3Service()