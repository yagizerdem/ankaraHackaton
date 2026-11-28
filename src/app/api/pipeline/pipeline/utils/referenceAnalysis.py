from ..interface import AnalyseInterface
from langchain_community.document_loaders import PyPDFLoader
class AnalyseNotes(AnalyseInterface):

    def _extract(self,*paths):
        #using langchain pdf parser for it 
      
        # loader = PyPDFLoader(path, mode="page")
        # docs = loader.load()
        for path in paths:
             loader=PyPDFLoader(path,mode='page')
             docs=loader.load()
             yield  docs
         
class AnalyseReference(AnalyseInterface):

     def _extract(self,*paths):
            #using langchain pdf parser for it  
            for path in paths:
                loader = PyPDFLoader(path, mode="page")
                docs = loader.load()
        
                yield docs

    