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


# They need change in the view function's names
# Setting up Blueprint
uploadBp=Blueprint("upload",__name__)

@uploadBp.route("/api/v1/upload/model",methods=['GET'])
def analyseLecture():
    # importing required libraries
    return session['lecture']['transcript']


@uploadBp.route("/api/v1/upload/model/<string:newVideoPath>",methods=['POST'])
def changeVideoTranscript(newVideoPath):
    from ..utils.videoTranscript import AnalyseVideo
    
    analyse=AnalyseVideo()
    destPath=os.path.join('resources','lessons','ders.mp4') ##you need to modify 
    videoPath=os.path.join(os.path.dirname(os.path.abspath(__file__)),destPath)
    path=analyse.convertVideoFormat(videoPath=videoPath)
    transcript=analyse.speechToText(path)

    session['lecture']['transcript']=transcript
    session['lesson']="Data Structure and Algorithms" #taken from frontend or authentication part
    return redirect("evaluate.showGANEvaluation")




