"""
Generate a secure SECRET_KEY for Django production deployment
Run this script: python generate_secret_key.py
"""
from django.core.management.utils import get_random_secret_key

if __name__ == "__main__":
    secret_key = get_random_secret_key()
    print("\n" + "="*60)
    print("SECURE SECRET_KEY GENERATED:")
    print("="*60)
    print(f"\nSECRET_KEY={secret_key}\n")
    print("="*60)
    print("Copy this to your production environment variables!")
    print("="*60 + "\n")
