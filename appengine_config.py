from gaesessions import SessionMiddleware
def webapp_add_wsgi_middleware(app):
    app = SessionMiddleware(app, cookie_key="00350096-56be-5aa1-afc8-9a0f403fg3a1")
    return app
