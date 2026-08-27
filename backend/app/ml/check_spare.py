from gigachat import GigaChat
from gigachat.models import Chat, Messages, MessagesRole
from app.core.config import GigaChatSettings
from loguru import logger
import asyncio
import json
from typing import Dict, Any
from datetime import datetime

async def check_spare(data: Dict[str, Any]) -> Dict[str, Any]:
    settings = GigaChatSettings()
    client = GigaChat(
        credentials=settings.giga_auth_key,
        model="GigaChat:latest",
        verify_ssl_certs=False,
    )

    system_msg = Messages(
        role=MessagesRole.SYSTEM,
        content=(
            "Ты — эксперт по обслуживанию автомобилей и запчастям. "
            "Проанализируй историю обслуживания и предскажи следующую замену. "
            "Учитывай рекомендации производителя, реальную историю обслуживания, "
            "средний пробег пользователя и условия эксплуатации. "
            "Отвечай ТОЛЬКО валидным JSON без дополнительного текста."
        ),
    )

    vehicle_info = data.get("vehicle_info", {})
    part_info = data.get("part_info", {})
    maintenance_history = data.get("maintenance_history", {})
    average_weekly_mileage = data.get("average_weekly_mileage")

    weekly_mileage_text = ""
    if average_weekly_mileage:
        weekly_mileage_text = f"Средний пробег пользователя: {average_weekly_mileage} км/неделя"

    user_prompt = f"""
Автомобиль: {vehicle_info.get('mark', 'Неизвестно')} {vehicle_info.get('model', 'Неизвестно')} {vehicle_info.get('year', 'Неизвестно')}
VIN: {vehicle_info.get('vin', 'Не указан')}
Тип КПП: {vehicle_info.get('transmission', 'Не указан')}
Мощность двигателя: {vehicle_info.get('engine_power', 'Не указана')} л.с.
Запчасть: {part_info.get('name', 'Неизвестно')}

История обслуживания:
- Пробеги при заменах: {', '.join(map(str, maintenance_history.get('array_mileage', [])))}
- Последняя замена: {maintenance_history.get('mileage_last_replaced', 0)} км
- Количество замен: {len(maintenance_history.get('array_mileage', []))}
- Средний интервал между заменами: {maintenance_history.get('average_interval', 'Не определен')} км

Статистика использования:
{weekly_mileage_text}

Предскажи следующее обслуживание и дай рекомендации.
Ответь в формате JSON:
{{
    "predicted_replacement_mileage": число,
    "estimated_replacement_date": "YYYY-MM-DD",
    "part_recommendation": "Опираясь на форумы в интернете и информацию из открытых источников дай рекомендации о продукции для данного автомобиля",
    "estimated_cost": число_стоимость_в_рублях ремонта данной запчасти
}}

Для расчета даты используй средний пробег пользователя.
Если средний пробег не указан, используй типичные значения для данной модели.
Учитывай характеристики автомобиля (мощность, тип КПП) при рекомендациях.
"""

    user_msg = Messages(role=MessagesRole.USER, content=user_prompt)

    loop = asyncio.get_running_loop()
    resp = await loop.run_in_executor(
        None, lambda: client.chat(Chat(messages=[system_msg, user_msg]))
    )

    content = resp.choices[0].message.content
    logger.info(f"GigaChat maintenance prediction: {content}")

    try:
        result = json.loads(content)
        result["prediction_timestamp"] = datetime.now().isoformat()
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse GigaChat JSON: {e}")
        return {
            "error": "invalid_response", 
            "raw_output": content,
            "prediction_timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"GigaChat error: {e}")
        return {
            "error": "gigachat_error",
            "message": str(e),
            "prediction_timestamp": datetime.now().isoformat()
        }

async def calculate_remaining_weeks(predicted_mileage: int, current_mileage: int, weekly_mileage: int) -> float:
    if weekly_mileage <= 0:
        return 0.0
    
    remaining_km = predicted_mileage - current_mileage
    return remaining_km / weekly_mileage

async def format_maintenance_recommendation(prediction: Dict[str, Any], current_mileage: int, weekly_mileage: int = None) -> Dict[str, Any]:
    if "error" in prediction:
        return prediction
    
    predicted_mileage = prediction.get("predicted_replacement_mileage", 0)
    remaining_km = predicted_mileage - current_mileage
    
    result = {
        "predicted_replacement_mileage": predicted_mileage,
        "estimated_replacement_date": prediction.get("estimated_replacement_date", ""),
        "part_recommendation": prediction.get("part_recommendation", ""),
        "estimated_cost": prediction.get("estimated_cost", 0),
        "remaining_km": remaining_km,
        "prediction_timestamp": prediction.get("prediction_timestamp", ""),
        "confidence": "high" if remaining_km > 5000 else "medium" if remaining_km > 1000 else "low"
    }
    
    if weekly_mileage and weekly_mileage > 0:
        remaining_weeks = await calculate_remaining_weeks(predicted_mileage, current_mileage, weekly_mileage)
        result["remaining_weeks"] = round(remaining_weeks, 1)
    
    if remaining_km <= 1000:
        result["notification_needed"] = True
        result["warning_level"] = "critical" if remaining_km <= 0 else "warning"
    else:
        result["notification_needed"] = False
        result["warning_level"] = "normal"
    
    return result