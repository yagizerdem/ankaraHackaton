##importing requried libraries
import os
import sys
import subprocess 

#flasks
import flask 
from flask import Blueprint
from flask import render_template,render_template_string,redirect

from flask import session,jsonify

from pathlib import Path

#httpx
import httpx

evaluateBp=Blueprint("evaluate",__name__)

@evaluateBp.route("/api/v1/evaluate/model",methods=['GET'])
def showGANEvaluation():
    
    return jsonify(session['transcript'])

@evaluateBp.route("/api/v1/evaluate/model/<string:lesson>",methods=['POST'])
def transferGANOutput(lesson):
    lesson=session['lesson']

    # from .examGeneration import videoTranscript
    # path="/home/dreams/Desktop/Projects/hackathons/AtlasHackathon/apps/pipeline/api/resources/lessons/ders.mp4"###
    destPath=os.path.join('resources','lessons','ders.mp4') ##you need to modify 
    path=os.path.join(os.path.dirname(os.path.abspath(__file__)),destPath)
    

    from ..analyse.AIPipeline import AIPipeline,prompt,systemPrompt
    
    systemPrompt=systemPrompt(prompt="You're lecturer who specifies {} Write 100 questions according submited transcript from user".format(lesson))
    session['lecture']['evaluate']=AIPipeline(lesson=lesson,transcript=session['lecture']['transcript'],systemPrompt=systemPrompt)

    return jsonify(session['lecture']['evaluate'])
   

@evaluateBp.route("/api/v1/evaluate/rag",methods=['GET'])
def showRAGEvaluation(lesson):
    lesson=session['lesson']
    return session['response']

@evaluateBp.route("/api/v1/evaluate/rag/<string:lesson>",methods=['POST'])
def transferRAGOutput(lesson):
    lesson=session['lesson']
    
    #implementation rag 
    from ..analyse.assesment.ragChain import textSplitter
    from ..analyse.assesment.ragChain import docs
    from ..analyse.assesment.ragChain import dbDir

    from ..analyse.assesment.ragChain import store
    from ..analyse.assesment.ragChain import create_vector_store

    from langchain.embeddings import HuggingFaceEmbeddings

    #importing required libraries
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.runnables import RunnablePassthrough

    #creating vector store
    vector_store=create_vector_store(docs,embeddings=HuggingFaceEmbeddings(model="Qwen3-Embedding-0.6B"),storeName="evulation")

    from ..analyse.assesment.ragChain import queryFromVectorStore
    from ..analyse.assesment.ragChain import AIPipeline
    from ..analyse.assesment.ragChain import format_docs
    from ..analyse.assesment.ragChain import ragPrompt

    #Create the RAG Chain
    ragChain=(
        {"context":queryFromVectorStore(embeddings=HuggingFaceEmbeddings(model="Qwen3-Embedding-0.6B"),storeName="evulation")
        | format_docs,"transcript": RunnablePassthrough()}
        |ragPrompt
        |AIPipeline()
    )

    session['rag']['evaluate']=ragChain.invoke(session['transcript'])

    return jsonify(session['rag']['evaluate'])

    