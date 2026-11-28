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



textBp=Blueprint("text",__name__)


@textBp.route("/api/v1/model/text/upload",methods=['GET'])
def abc():
    pass



@textBp.route("/api/v1/model/text/upload/<int:textId>",methods=['POST'])
def bcd(textId):pass



@textBp.route("/api/v1/model/text/evaluate/",methods=['GET'])
def cde():pass


@textBp.route("/api/v1/model/text/evaluate/<int:textId>",methods=['GET'])
def defg(textId):pass





