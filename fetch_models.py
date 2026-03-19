#!/usr/bin/env python3
"""
Script to fetch all available models from various AI API providers
and save them to JSON files.
"""

import os
import json
import requests
from datetime import datetime

# API endpoints with your keys
api_configs = {
    "openrouter": {
        "url": "https://openrouter.ai/api/v1/models",
        "key": ""  # set via environment variable OPENROUTER_API_KEY
    },
    "anthropic": {
        "url": "https://api.anthropic.com/v1/models",
        "key": "",  # set via environment variable ANTHROPIC_API_KEY
        "headers": {"anthropic-version": "2023-06-01"}
    },
    "openai": {
        "url": "https://api.openai.com/v1/models",
        "key": ""  # set via environment variable OPENAI_API_KEY
    },
    "deepseek": {
        "url": "https://api.deepseek.com/v1/models",
        "key": ""  # set via environment variable DEEPSEEK_API_KEY
    },
    "groq": {
        "url": "https://api.groq.com/openai/v1/models",
        "key": ""  # set via environment variable GROQ_API_KEY
    },
    "xai": {
        "url": "https://api.x.ai/v1/models",
        "key": ""  # set via environment variable XAI_API_KEY
    },
    "ollama": {
        "url": "http://localhost:11434/api/tags",
        "key": None
    }
}

def main():
    print("=" * 60)
    print("AI MODELS FETCHER")
    print("=" * 60)
    
    all_models = {}
    
    for provider, config in api_configs.items():
        print(f"\n📡 Fetching {provider}...")
        
        headers = {}
        if config.get("key"):
            if provider == "anthropic":
                headers["x-api-key"] = config["key"]
                headers["anthropic-version"] = "2023-06-01"
            else:
                headers["Authorization"] = f"Bearer {config['key']}"
        
        # Add any additional headers
        if config.get("headers"):
            headers.update(config["headers"])
        
        try:
            response = requests.get(config["url"], headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract model names
                if provider == "ollama":
                    models = [m["name"] for m in data.get("models", [])]
                else:
                    models = [m["id"] for m in data.get("data", [])]
                
                all_models[provider] = {
                    "count": len(models),
                    "models": sorted(models)
                }
                print(f"   ✅ Found {len(models)} models")
                
                # Show first few models
                if models:
                    print(f"   📋 First 5: {', '.join(models[:5])}")
                
            else:
                print(f"   ❌ Error {response.status_code}")
                if response.text:
                    print(f"   Message: {response.text[:200]}")
                    
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection error - Is {provider} running?")
            if provider == "ollama":
                print("   💡 Make sure Ollama is running: 'ollama serve'")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    # Save to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"ai_models_{timestamp}.json"
    
    output = {
        "generated": datetime.now().isoformat(),
        "total_models": sum(p["count"] for p in all_models.values()),
        "providers": all_models
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\n" + "=" * 60)
    print(f"✅ Complete! Results saved to {filename}")
    print("=" * 60)
    
    # Print summary
    print("\n📊 SUMMARY")
    for provider, data in all_models.items():
        print(f"  • {provider}: {data['count']} models")

if __name__ == "__main__":
    main()
