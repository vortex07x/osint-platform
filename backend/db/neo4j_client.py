import os
from neo4j import GraphDatabase
from dotenv import load_dotenv

load_dotenv()

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")

# TEMPORARY DEBUG — remove after confirming
print(f"[DEBUG] NEO4J_URI = {repr(NEO4J_URI)}")
print(f"[DEBUG] NEO4J_USER = {repr(NEO4J_USER)}")
print(f"[DEBUG] NEO4J_PASSWORD length = {len(NEO4J_PASSWORD) if NEO4J_PASSWORD else 'None'}")
print(f"[DEBUG] NEO4J_PASSWORD repr = {repr(NEO4J_PASSWORD[:6])}...{repr(NEO4J_PASSWORD[-6:]) if NEO4J_PASSWORD else ''}")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def get_neo4j_session():
    return driver.session()


def close_neo4j_driver():
    driver.close()