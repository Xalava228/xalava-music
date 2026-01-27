#!/usr/bin/env python3
"""
Генератор SECRET_KEY для Flask приложения
"""
import secrets

def generate_secret_key():
    """Генерирует безопасный секретный ключ"""
    return secrets.token_hex(32)

if __name__ == '__main__':
    key = generate_secret_key()
    print("=" * 60)
    print("Ваш SECRET_KEY (скопируйте его):")
    print("=" * 60)
    print(key)
    print("=" * 60)
    print("\nДлина:", len(key), "символов")
    print("\nИспользуйте этот ключ в переменных окружения:")
    print("SECRET_KEY=" + key)
    print("=" * 60)
