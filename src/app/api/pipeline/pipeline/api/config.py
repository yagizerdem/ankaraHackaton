import os
from dotenv import load_dotenv
load_dotenv()


class Config:
    ##POSTRESQL
    POSTRESQL_URL=os.getenv("POSTRESQL_URL")

    #SUPABASE
    SUPABASE_URL=os.getenv("SUPABASE_URL")
    SUPABASE_PUBLISHABLE_KEY=os.getenv("SUPABASE_PUBLISHABLE_KEY")
    SUPABASE_SECRET_KEY=os.getenv("SUPABASE_SECRET_KEY")
    SUPABASE_JWKS_URL=os.getenv("SUPABASE_JWKS_URL")
    SUPABASE_SECRET_KEY=os.getenv("SUPABASE_SECRET_KEY")

    #SESSION
    SECRET_KEY=os.getenv("SECRET_KEY")
    SESSION_PERMANENT=os.getenv("SESSION_PERMANENT")
    SESSION_TYPE=os.getenv("SESSION_TYPE")



    # postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.jreqdousnynldrxgccth.supabase.co:5432/postgres

