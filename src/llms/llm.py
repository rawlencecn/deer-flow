# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

from pathlib import Path
from typing import Any, Dict, Union
import os
import asyncio
import time

from langchain_openai import ChatOpenAI
from langchain_deepseek import ChatDeepSeek
from typing import get_args

from src.config import load_yaml_config
from src.config.agents import LLMType, MultiModelType, MULTI_MODEL_CONFIG_MAP

# Cache for LLM instances
_llm_cache: dict[LLMType, ChatOpenAI] = {}
_multi_model_cache: dict[str, Union[ChatOpenAI, ChatDeepSeek]] = {}


def _get_config_file_path() -> str:
    """Get the path to the configuration file."""
    return str((Path(__file__).parent.parent.parent / "conf.yaml").resolve())


def _get_llm_type_config_keys() -> dict[str, str]:
    """Get mapping of LLM types to their configuration keys."""
    return {
        "reasoning": "REASONING_MODEL",
        "basic": "BASIC_MODEL",
        "vision": "VISION_MODEL",
    }


def _get_env_llm_conf(llm_type: str) -> Dict[str, Any]:
    """
    Get LLM configuration from environment variables.
    Environment variables should follow the format: {LLM_TYPE}__{KEY}
    e.g., BASIC_MODEL__api_key, BASIC_MODEL__base_url
    """
    prefix = f"{llm_type.upper()}_MODEL__"
    conf = {}
    for key, value in os.environ.items():
        if key.startswith(prefix):
            conf_key = key[len(prefix) :].lower()
            conf[conf_key] = value
    return conf


def _create_llm_use_conf(
    llm_type: LLMType, conf: Dict[str, Any]
) -> ChatOpenAI | ChatDeepSeek:
    """Create LLM instance using configuration."""
    llm_type_config_keys = _get_llm_type_config_keys()
    config_key = llm_type_config_keys.get(llm_type)

    if not config_key:
        raise ValueError(f"Unknown LLM type: {llm_type}")

    llm_conf = conf.get(config_key, {})
    if not isinstance(llm_conf, dict):
        raise ValueError(f"Invalid LLM configuration for {llm_type}: {llm_conf}")

    # Get configuration from environment variables
    env_conf = _get_env_llm_conf(llm_type)

    # Merge configurations, with environment variables taking precedence
    merged_conf = {**llm_conf, **env_conf}

    if not merged_conf:
        raise ValueError(f"No configuration found for LLM type: {llm_type}")

    if llm_type == "reasoning":
        merged_conf["api_base"] = merged_conf.pop("base_url", None)

    return (
        ChatOpenAI(**merged_conf)
        if llm_type != "reasoning"
        else ChatDeepSeek(**merged_conf)
    )


def get_llm_by_type(
    llm_type: LLMType,
) -> ChatOpenAI:
    """
    Get LLM instance by type. Returns cached instance if available.
    """
    if llm_type in _llm_cache:
        return _llm_cache[llm_type]

    conf = load_yaml_config(_get_config_file_path())
    llm = _create_llm_use_conf(llm_type, conf)
    _llm_cache[llm_type] = llm
    return llm


def get_configured_llm_models() -> dict[str, list[str]]:
    """
    Get all configured LLM models grouped by type.

    Returns:
        Dictionary mapping LLM type to list of configured model names.
    """
    try:
        conf = load_yaml_config(_get_config_file_path())
        llm_type_config_keys = _get_llm_type_config_keys()

        configured_models: dict[str, list[str]] = {}

        for llm_type in get_args(LLMType):
            # Get configuration from YAML file
            config_key = llm_type_config_keys.get(llm_type, "")
            yaml_conf = conf.get(config_key, {}) if config_key else {}

            # Get configuration from environment variables
            env_conf = _get_env_llm_conf(llm_type)

            # Merge configurations, with environment variables taking precedence
            merged_conf = {**yaml_conf, **env_conf}

            # Check if model is configured
            model_name = merged_conf.get("model")
            if model_name:
                configured_models.setdefault(llm_type, []).append(model_name)

        return configured_models

    except Exception as e:
        # Log error and return empty dict to avoid breaking the application
        print(f"Warning: Failed to load LLM configuration: {e}")
        return {}


def get_multi_model_config(model_id: str) -> Dict[str, Any]:
    """
    Get base configuration for a multi-model by ID.
    """
    if model_id not in MULTI_MODEL_CONFIG_MAP:
        raise ValueError(f"Unknown multi-model ID: {model_id}")

    model_config = MULTI_MODEL_CONFIG_MAP[model_id]
    conf = load_yaml_config(_get_config_file_path())
    
    # Get configuration from YAML file
    config_key = model_config["config_key"]
    yaml_conf = conf.get(config_key, {})
    
    # Get configuration from environment variables
    env_conf = _get_env_llm_conf(model_id.replace("-", "_"))
    
    # Merge configurations, with environment variables taking precedence
    merged_conf = {**yaml_conf, **env_conf}
    
    if "model" not in merged_conf:
        merged_conf["model"] = model_config["default_model"]
    
    return merged_conf


def get_multi_model_instance(model_id: str) -> Union[ChatOpenAI, ChatDeepSeek]:
    """
    Get LLM instance for multi-model comparison by model ID.
    Returns cached instance if available.
    """
    if model_id in _multi_model_cache:
        return _multi_model_cache[model_id]

    if model_id not in MULTI_MODEL_CONFIG_MAP:
        raise ValueError(f"Unknown multi-model ID: {model_id}")

    model_config = MULTI_MODEL_CONFIG_MAP[model_id]
    merged_conf = get_multi_model_config(model_id)
    
    if model_config["provider"] == "deepseek":
        if "base_url" in merged_conf:
            merged_conf["api_base"] = merged_conf.pop("base_url")
        llm = ChatDeepSeek(**merged_conf)
    else:
        llm = ChatOpenAI(**merged_conf)
    
    _multi_model_cache[model_id] = llm
    return llm


def get_multi_model_instance_with_params(model_id: str, custom_params: dict = None) -> Union[ChatOpenAI, ChatDeepSeek]:
    """
    Get LLM instance for multi-model comparison with custom parameters.
    
    Args:
        model_id: ID of the model to create instance for
        custom_params: Optional custom parameters to override defaults
        
    Returns:
        LLM instance configured with merged parameters
    """
    if model_id in _multi_model_cache and not custom_params:
        return _multi_model_cache[model_id]
    
    if model_id not in MULTI_MODEL_CONFIG_MAP:
        raise ValueError(f"Unknown multi-model ID: {model_id}")
    
    model_config = MULTI_MODEL_CONFIG_MAP[model_id]
    
    base_conf = get_multi_model_config(model_id)
    
    default_params = model_config.get("default_params", {})
    
    final_params = {**default_params, **(custom_params or {})}
    merged_conf = {**base_conf, **final_params}
    
    if model_config["provider"] == "deepseek":
        if "base_url" in merged_conf:
            merged_conf["api_base"] = merged_conf.pop("base_url")
        llm = ChatDeepSeek(**merged_conf)
    else:
        llm = ChatOpenAI(**merged_conf)
    
    if not custom_params:
        _multi_model_cache[model_id] = llm
    
    return llm


async def execute_single_model(
    messages: list, 
    model_id: str, 
    timeout: int = 120,
    custom_params: dict = None
) -> dict:
    """
    Execute a single model with timeout and return standardized output.
    
    Args:
        messages: List of messages to send to the model
        model_id: ID of the model to use
        timeout: Timeout in seconds
        custom_params: Optional custom parameters to override defaults
        
    Returns:
        Dictionary with execution results and metrics
    """
    start_time = time.time()
    
    try:
        llm = get_multi_model_instance_with_params(model_id, custom_params)
        
        result = await asyncio.wait_for(
            llm.ainvoke(messages),
            timeout=timeout
        )
        
        execution_time = time.time() - start_time
        
        content = result.content if hasattr(result, 'content') else str(result)
        token_usage = getattr(result, 'usage_metadata', {})
        total_tokens = token_usage.get('total_tokens', len(content.split()))
        
        return {
            "model_id": model_id,
            "content": content,
            "execution_time": execution_time,
            "tokens": total_tokens,
            "success": True,
            "custom_params": custom_params
        }
        
    except asyncio.TimeoutError:
        return {
            "model_id": model_id,
            "error": "timeout",
            "execution_time": timeout,
            "success": False,
            "custom_params": custom_params
        }
    except Exception as e:
        return {
            "model_id": model_id,
            "error": str(e),
            "execution_time": time.time() - start_time,
            "success": False,
            "custom_params": custom_params
        }


def get_available_multi_models() -> list[str]:
    """
    Get list of available multi-model IDs for comparison.
    
    Returns:
        List of model IDs that can be used for multi-model comparison
    """
    return list(MULTI_MODEL_CONFIG_MAP.keys())


# In the future, we will use reasoning_llm and vl_llm for different purposes
# reasoning_llm = get_llm_by_type("reasoning")
# vl_llm = get_llm_by_type("vision")
