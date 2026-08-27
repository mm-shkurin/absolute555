from celery import shared_task, states
from celery.exceptions import Ignore
from app.services.s3_service import s3_service
from loguru import logger

@shared_task(bind = True, name = "upload_photos_task")
async def upload_photos_task(self,car_id,files:list[dict]) -> dict :
    try:
        self.update_state(state = states.STARTED,meta = {"progress":"processing"})

        urls = []

        for f in files:
            filename = f["filename"]
            path = f["path"]

            with open(path, "rb") as file_obj:
                url = await s3_service.upload_file(car_id,filename,file_obj)
                urls.appends(url)

            self.update_state(state = states.STARTED, meta = {"progress":"save photos as json"})
            photoss_json_url = await s3_service.save_photos_json(car_id,urls)

            return{
                "status":"sucess",
                "photos":urls,
                "photos_json":photoss_json_url,
            }
    except Exception as e:
        logger.error(f"Error upload_task:{e}")
        self.update_state(state=states.FAILURE, meta={"error": str(e)})
    raise Ignore()