from ..interface import AnalyseInterface

import os
import sys

import httpx
from pathlib import Path


class videoTranscript(AnalyseInterface):

    def convertVideoFormat(self,videoPath,outputPath='./'):
            ##converting current audio format to m4a file format
            #importing required libraries
            import subprocess
            import os
            # verify video path
            if os.path.exists(os.path.abspath(videoPath)):
                #  running subprocess
                commands=[
                     "bash",
                     "-c",
                     "ffmpeg -i {} -vn -c:a copy {}/output.m4a".format(os.path.abspath(videoPath),os.path.abspath(outputPath))
                ]
                subprocess.check_output(commands,text=True,timeout=0.5)
                #checking current video path
                if os.path.abspath(os.path.join(os.path.abspath(outputPath,"output.m4a"))):
                     print("Conversion is completed")
                     return os.path.join(os.path.abspath(outputPath,"output.m4a"))
                else:
                     return Exception("Raise Error file format conversion")

            else:
                 return Exception("Target video file couldn't find!!!/n Look up path")
        
    #this method request
    def speechToText(self,**data):
        #Using groq API for speechTotext
        # requesting current api with httpx
        api_url=os.getenv("SPEECH_TEXT_API_URL")

        from dotenv import load_dotenv
        load_dotenv()

        headers={
            "Authorization":f"Bearer {os.getenv("SPEECH_TEXT_API_KEY")}",
            "Content-Type":"multipart/form-data"
        }
        #error handling
        try:
            response=httpx.post(api_url,headers=headers,data=data)
            response.raise_for_status()
            if response.status_code==httpx.codes.OK:
                return response.json()['text']
        except httpx.HTTPError as e:
            print("Response Error,Look up request")
        finally:
            print(httpx.codes.NOT_FOUND)
            
    def _extract(self):
            #Prepare current transcript RAG based format
            pass  
    def decreaseVideo(self):
         pass
    def checkingFileSize(MAX_SIZE=25):
         #if it exceeeds video file size,returns error
         pass
