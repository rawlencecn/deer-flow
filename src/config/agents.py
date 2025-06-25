# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from typing import Literal

# Define available LLM types
LLMType = Literal["basic", "reasoning", "vision"]

MultiModelType = Literal["qwen1.5-72b", "gpt-4-turbo", "deepseek-v3", "claude-3", "doubao-pro"]

# Define agent-LLM mapping
AGENT_LLM_MAP: dict[str, LLMType] = {
    "coordinator": "basic",
    "planner": "basic",
    "researcher": "basic",
    "coder": "basic",
    "reporter": "basic",
    "podcast_script_writer": "basic",
    "ppt_composer": "basic",
    "prose_writer": "basic",
    "prompt_enhancer": "basic",
    "multi_model_comparison": "basic",
}

DEFAULT_MULTI_MODELS = ["qwen1.5-72b", "gpt-4-turbo", "deepseek-v3"]

MULTI_MODEL_CONFIG_MAP: dict[str, dict] = {
    "qwen1.5-72b": {
        "provider": "openai",
        "config_key": "QWEN_MODEL",
        "default_model": "qwen1.5-72b-chat",
        "default_params": {
            "temperature": 0.7,
            "max_tokens": 2048,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    },
    "gpt-4-turbo": {
        "provider": "openai", 
        "config_key": "GPT4_MODEL",
        "default_model": "gpt-4-turbo",
        "default_params": {
            "temperature": 0.7,
            "max_tokens": 4096,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    },
    "deepseek-v3": {
        "provider": "deepseek",
        "config_key": "DEEPSEEK_MODEL", 
        "default_model": "deepseek-chat",
        "default_params": {
            "temperature": 0.7,
            "max_tokens": 2048,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    },
    "claude-3": {
        "provider": "openai",
        "config_key": "CLAUDE_MODEL",
        "default_model": "claude-3-sonnet-20240229",
        "default_params": {
            "temperature": 0.7,
            "max_tokens": 4096,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    },
    "doubao-pro": {
        "provider": "openai",
        "config_key": "DOUBAO_MODEL",
        "default_model": "doubao-1-5-pro-32k-250115",
        "default_params": {
            "temperature": 0.7,
            "max_tokens": 2048,
            "top_p": 1.0,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    }
}
