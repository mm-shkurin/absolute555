"""Service providers of the chat feature: where its routers get services, wired with their collaborators."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.features.chat.services.chat_reader import ChatReader
from app.features.chat.services.chat_service import ChatService


def get_chat_service(db: AsyncSession = Depends(get_db)) -> ChatService:
    return ChatService(db)


def get_chat_reader(db: AsyncSession = Depends(get_db)) -> ChatReader:
    return ChatReader(db)
