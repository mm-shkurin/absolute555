import asyncio
import json
import chromadb
from loguru import logger
from typing import Optional
from app.core.config import ChromaSettings
from app.services.cache_service import cache_service
from typing import Optional, Dict, Any, List
chroma_settings = ChromaSettings()

class ChromaService:
    def __init__(self, collection_name: str = None):
        self.host = chroma_settings.chroma_network_name
        self.port = chroma_settings.chroma_port
        self.collection_name = collection_name or chroma_settings.chroma_collection_name
        try:
            if self.host and self.port:
                self.client = chromadb.HttpClient(host=self.host, port=self.port)
            else:
                self.client = chromadb.PersistentClient()
            self.collection = self.client.get_or_create_collection(self.collection_name)
        except Exception as e:
            logger.exception(f"Failed to initialize Chroma client/collection: {e}")
            raise

    async def save_document(self, document_id: str, data: dict) -> str:
        loop = asyncio.get_event_loop()
        payload = json.dumps(data, ensure_ascii=False)
        
        await loop.run_in_executor(
            None,
            lambda: self.collection.add(
                ids=[document_id],
                documents=[payload]
            )
        )
        await cache_service.set("chroma", document_id, data)
        logger.debug(f"Cached saved document {document_id}")
        return document_id

    async def get_document(self, document_id: str, use_cache: bool = True) -> Optional[dict]:
        if use_cache:
            cached_data = await cache_service.get("chroma", document_id)
            if cached_data is not None:
                logger.debug(f"Cache hit for document {document_id}")
                return cached_data
        
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.collection.get(ids=[document_id])
        )
        docs = res.get("documents", [])
        if docs and docs[0]:
            try:
                data = json.loads(docs[0])
                if use_cache:
                    await cache_service.set("chroma", document_id, data)
                    logger.debug(f"Cached document {document_id}")
                return data
            except Exception as e:
                logger.warning(f"Failed to parse JSON: {e}, raw: {docs[0]}")
                return {"raw": docs[0]}
        return None
        

    async def delete_document(self, document_id: str) -> str:
        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                self.collection.delete,
                [document_id]
            )
            await cache_service.delete("chroma", document_id)
            logger.debug(f"Deleted from cache: {document_id}")
            return document_id
        except Exception as e:
            logger.exception(f"Chroma delete_document error for id={document_id}: {e}")
            raise

    async def update_document(self, document_id: str, data: dict) -> bool:
        loop = asyncio.get_event_loop()
        try:
            payload = json.dumps(data, ensure_ascii=False)
            await loop.run_in_executor(None, self.collection.delete, [document_id])
            await loop.run_in_executor(
                None,
                lambda: self.collection.add(
                    ids=[document_id],
                    documents=[payload]
                )
            )
            await cache_service.set("chroma", document_id, data)
            logger.debug(f"Updated cache for document {document_id}")
            return True
        except Exception as e:
            logger.exception(f"Chroma update_document error for id={document_id}: {e}")
            raise
    
    async def get_documents_batch(self, document_ids: list[str], use_cache: bool = True) -> dict[str, Optional[dict]]:
        if not document_ids:
            return {}
        
        result = {}
        uncached_ids = []
        
        if use_cache:
            for doc_id in document_ids:
                cached_data = await cache_service.get("chroma", doc_id)
                if cached_data is not None:
                    result[doc_id] = cached_data
                    logger.debug(f"Cache hit for document {doc_id}")
                else:
                    uncached_ids.append(doc_id)
        else:
            uncached_ids = document_ids
        
        if not uncached_ids:
            return result
        
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(
            None,
            lambda: self.collection.get(ids=uncached_ids)
        )
        
        docs = res.get("documents", [])
        ids = res.get("ids", [])
        
        for i, doc_id in enumerate(ids):
            if i < len(docs) and docs[i]:
                try:
                    data = json.loads(docs[i])
                    result[doc_id] = data
                    if use_cache:
                        await cache_service.set("chroma", doc_id, data)
                        logger.debug(f"Cached document {doc_id}")
                except Exception as e:
                    logger.warning(f"Failed to parse JSON for {doc_id}: {e}")
                    result[doc_id] = {"raw": docs[i]}
            else:
                result[doc_id] = None
        
        return result