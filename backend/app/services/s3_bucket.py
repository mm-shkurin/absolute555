"""Getting to the bucket: the client, the bucket itself, and object keys.

Split out of S3Service when that file passed the 200-line limit. None of it needs the
service's state, and the public-read policy is the kind of thing worth finding in one
place rather than inside a constructor.
"""

import json
import uuid
from typing import Optional

import boto3

from app.core.config import MinioSettings


def build_client(settings: MinioSettings):
    return boto3.client(
        "s3",
        aws_access_key_id=settings.minio_root_user,
        aws_secret_access_key=settings.minio_root_password,
        endpoint_url=settings.minio_endpoint_url,
    )


def public_base_url(settings: MinioSettings) -> str:
    # Photo links are handed to browsers over https; the internal endpoint is plain http.
    endpoint = str(settings.minio_endpoint_url)
    if endpoint.startswith("http://"):
        return endpoint.replace("http://", "https://").rstrip("/")
    return endpoint.rstrip("/")


def ensure_bucket_exists(client, bucket: str) -> None:
    try:
        client.head_bucket(Bucket=bucket)
    except client.exceptions.ClientError as error:
        if error.response["Error"]["Code"] != "404":
            raise
        client.create_bucket(Bucket=bucket)
        client.put_bucket_policy(Bucket=bucket, Policy=_read_policy(bucket))


def generate_key(car_id: str, filename: Optional[str], folder: str) -> str:
    ext = filename.split(".")[-1] if filename and "." in filename else ""
    suffix = f".{ext}" if ext else ""
    return f"{car_id}/{folder}/{uuid.uuid4().hex}{suffix}"


def _read_policy(bucket: str) -> str:
    return json.dumps(
        {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": "*"},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket}/*"],
                }
            ],
        }
    )
