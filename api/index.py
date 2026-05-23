import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = ROOT / "backend"

if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from app import app


class BackendPrefixMiddleware:
    def __init__(self, wrapped_app):
        self.wrapped_app = wrapped_app

    def __call__(self, environ, start_response):
        path_info = environ.get("PATH_INFO", "")
        if path_info == "/backend":
            environ["PATH_INFO"] = "/"
        elif path_info.startswith("/backend/"):
            environ["PATH_INFO"] = path_info[len("/backend"):]

        return self.wrapped_app(environ, start_response)


app.wsgi_app = BackendPrefixMiddleware(app.wsgi_app)
