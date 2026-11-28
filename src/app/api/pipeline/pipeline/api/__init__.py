#importing required libraries
import os
from pathlib import Path
##flask
import flask
from flask import Flask
from flask import render_template,render_template_string
from flask import jsonify,redirect
#flask-session
from flask_session import Session

# from flasgger import Swagger

import connexion
from connexion import ConnexionMiddleware

from .init_db import init_db

def init_app(test_config=None):
    flaskApp=Flask(__name__,instance_relative_config=True)
 
    import dotenv
    from dotenv import load_dotenv
    import os
    load_dotenv()   

    if test_config is None:
        from .config import Config
        flaskApp.config.from_object(Config)
    else:
        #load config from config.py
        flaskApp.config.from_mapping(test_config)
        
    os.makedirs(flaskApp.instance_path,exist_ok=True)
    # initializing Session
    Session(flaskApp)
    init_db()

    ## registering blueprint in current app
    # importing required libraries
    from .upload import uploadBp
    from .index import indexBp
    from .evaluate import evaluateBp

    flaskApp.register_blueprint(uploadBp)
    flaskApp.register_blueprint(indexBp)
    flaskApp.register_blueprint(evaluateBp)

    from flask_swagger_ui import get_swaggerui_blueprint

    SWAGGER_URL = '/docs'
    API_URL = '/static/swagger.yml'

    swaggerui_blueprint = get_swaggerui_blueprint(SWAGGER_URL, API_URL)
    flaskApp.register_blueprint(swaggerui_blueprint)

    return flaskApp
    