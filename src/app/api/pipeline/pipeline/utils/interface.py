##defining interface
#defining required libraries
from abc import ABC,abstractmethod

class AnalyseInterface(ABC):

    @abstractmethod
    def extract(self):
        pass
