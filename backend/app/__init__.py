# Deliberately empty.

# This file used to read:
#     from .api import api_router
#     from .main import app
#     app.include_router(api_router)
#
# which mounted every domain router at the application root as a side effect of
# importing the `app` package, through a circular import: `app/__init__` imported
# `app.main`, which imports back into `app.*`. Routing lived in whichever module the
# interpreter happened to reach first, and `main.py` — the file anyone looks in — showed
# only /auth and the docs.
#
# Mounting is now stated once, in `create_app()`, under the /api/v1 prefix.
