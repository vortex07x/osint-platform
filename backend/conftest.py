import sys
import os

# ai_engine/ and scrapers/ live at the project root, one level above backend/.
# Add the project root to sys.path so tests can import them the same way
# main.py does at runtime.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))