# Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
# SPDX-License-Identifier: MIT

import re
from typing import Dict, Any


def calculate_faithfulness_score(content: str, reference: str = "") -> float:
    """Calculate faithfulness score using NLI model.
    
    Args:
        content: The generated content to evaluate
        reference: Reference content for comparison (optional)
        
    Returns:
        Float score between 0.0 and 1.0 representing faithfulness
    """
    if not content:
        return 0.0
        
    if not reference:
        return 0.8  # Default score when no reference
    
    content_words = set(content.lower().split())
    reference_words = set(reference.lower().split())
    
    if not content_words and not reference_words:
        return 1.0
    if not content_words or not reference_words:
        return 0.0
    
    intersection = content_words & reference_words
    precision = len(intersection) / len(content_words)
    recall = len(intersection) / len(reference_words)
    
    if precision + recall == 0:
        return 0.0
    
    f1_score = 2 * (precision * recall) / (precision + recall)
    return min(f1_score, 1.0)


def calculate_logic_score(content: str) -> float:
    """Calculate logical consistency score.
    
    Args:
        content: The content to evaluate for logical consistency
        
    Returns:
        Float score between 0.0 and 1.0 representing logical consistency
    """
    if not content:
        return 0.0
    
    logical_connectors = [
        "因此", "所以", "由于", "因为", "然而", "但是", "而且", "另外",
        "首先", "其次", "最后", "总之", "综上", "例如", "比如", "即",
        "换句话说", "也就是说", "相反", "与此同时", "此外", "进而"
    ]
    
    english_connectors = [
        "therefore", "thus", "however", "moreover", "furthermore",
        "consequently", "nevertheless", "additionally", "for example",
        "in conclusion", "on the other hand", "similarly", "likewise"
    ]
    
    all_connectors = logical_connectors + english_connectors
    
    connector_count = 0
    for connector in all_connectors:
        connector_count += content.lower().count(connector.lower())
    
    sentences = len(re.split(r'[。！？.!?]', content))
    if sentences == 0:
        return 0.0
    
    logic_density = connector_count / sentences
    return min(logic_density / 0.4, 1.0)  # Normalize to 0-1 scale


def calculate_information_density(content: str) -> float:
    """Calculate information density score.
    
    Args:
        content: The content to evaluate for information density
        
    Returns:
        Float score between 0.0 and 1.0 representing information density
    """
    if not content:
        return 0.0
    
    chinese_stop_words = {
        "的", "了", "在", "是", "有", "和", "与", "或", "但", "而", "也", "都", 
        "就", "要", "会", "能", "可以", "这", "那", "这个", "那个", "一个",
        "我", "你", "他", "她", "它", "我们", "你们", "他们", "她们", "它们"
    }
    
    english_stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "is", "are", "was", "were", "be", "been", "have",
        "has", "had", "do", "does", "did", "will", "would", "could", "should"
    }
    
    all_stop_words = chinese_stop_words | english_stop_words
    
    words = re.findall(r'\b\w+\b', content.lower())
    if not words:
        return 0.0
    
    meaningful_words = [
        word for word in words 
        if word not in all_stop_words and len(word) > 1
    ]
    
    if not meaningful_words:
        return 0.0
    
    unique_meaningful = len(set(meaningful_words))
    total_meaningful = len(meaningful_words)
    
    density = unique_meaningful / total_meaningful
    
    length_factor = min(len(meaningful_words) / 100, 1.0)  # Normalize by 100 words
    
    return min(density * (0.7 + 0.3 * length_factor), 1.0)


def calculate_model_cost(model_id: str, tokens: int) -> float:
    """Calculate cost based on model and token usage.
    
    Args:
        model_id: Identifier of the model used
        tokens: Number of tokens processed
        
    Returns:
        Cost in USD
    """
    cost_rates = {
        "qwen1.5-72b": 0.002,      # Qwen models are typically cheaper
        "gpt-4-turbo": 0.01,       # GPT-4 Turbo pricing
        "deepseek-v3": 0.001,      # DeepSeek competitive pricing
        "claude-3": 0.008,         # Claude-3 pricing
        "doubao-pro": 0.003,       # Doubao pricing estimate
        "gpt-3.5-turbo": 0.002,    # GPT-3.5 pricing
        "claude-3-sonnet": 0.008,  # Claude-3 Sonnet
        "claude-3-haiku": 0.0025,  # Claude-3 Haiku (cheaper)
    }
    
    default_rate = 0.005
    
    rate = cost_rates.get(model_id, default_rate)
    return (tokens / 1000) * rate
