##importing requried libraries
import os
import sys
import subprocess 

#flasks
import flask 
from flask import Blueprint
from flask import render_template,render_template_string,redirect

from flask import session

#httpx
import httpx
import connexion



videoBp=Blueprint("video",__name__)


@videoBp.route("/api/v1/model/video/upload",methods=['GET'])
def abc():
    pass



@videoBp.route("/api/v1/model/video/upload/<int:videoId>",methods=['POST'])
def bcd(videoId):pass



@videoBp.route("/api/v1/model/video/evaluate/",methods=['GET'])
def cde():pass


@videoBp.route("/api/v1/model/video/evaluate/<int:videoId>",methods=['GET'])
def defg():pass





