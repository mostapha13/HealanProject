"""Explicitly cache an approved embedding model for offline runtime use."""
import argparse
import os
import time

from sentence_transformers import SentenceTransformer


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="BAAI/bge-m3")
    parser.add_argument("--cache-dir",
                        default=os.getenv("SENTENCE_TRANSFORMERS_HOME", "/models"))
    parser.add_argument("--retries", type=int, default=100)
    parser.add_argument("--retry-delay", type=int, default=10)
    arguments = parser.parse_args()
    for attempt in range(1, arguments.retries + 1):
        try:
            SentenceTransformer(arguments.model, cache_folder=arguments.cache_dir)
            print(f"Cached {arguments.model} in {arguments.cache_dir}")
            break
        except Exception as exc:
            if attempt == arguments.retries:
                raise
            detail = " ".join(str(exc).split())[:500]
            print(f"Model download attempt {attempt} failed: "
                  f"{type(exc).__name__}: {detail}; "
                  f"resuming in {arguments.retry_delay}s",
                  flush=True)
            time.sleep(arguments.retry_delay)
