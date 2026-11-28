import os
from supabase import create_client,Client
from sqlalchemy.pool import NullPool
from sqlalchemy import create_engine
from postgrest import APIError
def init_db():
    from dotenv import load_dotenv
    load_dotenv()
    # database
    #Connecting supabase to compouter
    supabase:Client=create_client(os.getenv("SUPABASE_URL"),os.getenv("SUPABASE_SECRET_KEY"))

    # connecting supabase into SQL Alchemy ORM
    con=create_engine(os.getenv("POSTGRESQL_URL"),client_encoding="utf-8",poolclass=NullPool)

    return con,supabase