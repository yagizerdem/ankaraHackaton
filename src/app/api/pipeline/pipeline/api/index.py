##importing requried libraries
import os
import sys
import subprocess 

#flasks
import flask 
from flask import Blueprint
from flask import render_template,render_template_string,redirect

from flask import session

# database
from supabase import create_client,Client
from sqlalchemy.pool import NullPool
from sqlalchemy import create_engine
from postgrest import APIError

#httpx
import httpx

# Setting up Blueprint
indexBp=Blueprint("index",__name__)

@indexBp.route("/",methods=['GET'])
def index():
    return redirect("upload.analyseVideo")