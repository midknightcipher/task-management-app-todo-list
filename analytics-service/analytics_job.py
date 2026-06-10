import sys
from pipeline import run_all_pipelines

if __name__ == "__main__":
    success = run_all_pipelines()
    sys.exit(0 if success else 1)