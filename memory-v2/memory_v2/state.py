"""Define the state structures for the agent."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class State:
    original_post: str = ""
    """The original post that the user submitted feedback on"""
    new_post: str = ""
    """The new post after feedback and revision"""
    user_response: str = ""
    """The user's feedback on the new post"""
