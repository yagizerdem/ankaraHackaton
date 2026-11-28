#!/usr/bin/env python
# coding: utf-8

# In[ ]:


#importing required libraries
from referenceAnalysis import AnalyseReference

analyse=AnalyseReference()

datas=analyse._extract()

# In[ ]:


##Ingestion
##data to chunks
import os 

from langchain.text_splitter import CharacterTextSpliter

#texts to chunks
textSplitter=CharacterTextSpliter(chunk_size=1000,chunk_overlap=0)
docs=textSplitter.split_documents(datas)


# In[ ]:


import os

currentDir=os.path.dirname(os.path.abspath(__file__))
dbDir=os.path.join(currentDir,"db")

# In[ ]:


import os
#creating vector store
from langchain_community.vectorstores import Chroma
def create_vector_store(docs,embeddings,storeName):
    persDir=os.path.join(dbDir,storeName)
    if not os.path.exists(persDir):
        vectorDb=Chroma.from_documents(
            docs,embeddings,persDir=persDir
        )
        return vectorDb
    else:
        print(
            f"Vector store {storeName} already exists.No need to initialize"
        )

# In[ ]:


def AIPipeline():
    from transformers import AutoModelForCausalLM, AutoTokenizer

    model_name = "Qwen/Qwen2.5-0.5B-Instruct"

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype="auto",
        device_map="auto"
    )
    llm= AutoTokenizer.from_pretrained(model_name)
 
    return llm
    #creating rag chain

# In[ ]:


##Retrival
# Function to query a vector store
def queryFromVectorStore(storeName,embeeding):
    persDir=os.path.join(dbDir,storeName)
    if os.path.exists(persDir):
        db=Chroma(
            persist_directory=persDir,
            embedding_function=embeeding
        )
        retriever=db.as_retreiver(
            search_type="similarity_score_threshold",
            search_kwargs={"k":3,"score_threshold":0.1}
        )

        return retriever

# In[ ]:


# Create Document Parsing Function to String
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

# In[ ]:



