"""The reflection graph."""

from typing import Any, Dict

from langchain_anthropic import ChatAnthropic
from langgraph.graph import StateGraph
from langgraph.store.base import BaseStore
from langmem.prompts.looping import (
    Prompt,
    create_prompt_optimizer,
)

from memory_v2.state import State

REFLECTION_PROMPT = """You are helping an AI assistant learn by optimizing its prompt.

<context>
You are provided with two social media posts: the original, and the revised version.
The post was revised based on user feedback, which is also provided to you.
</context>

You are an AI assistant tasked with analyzing social media post revisions and user feedback to determine if a new rule should be created for future post modifications.
Your goal is to identify patterns in the changes requested by the user and decide if these changes should be applied automatically in the future.

You will be given three pieces of information:

1. The original social media post:
<original_post>
{ORIGINAL_POST}
</original_post>

2. The revised post:
<new_post>
{NEW_POST}
</new_post>

3. The user's response to the revision:
<user_response>
{USER_RESPONSE}
</user_response>

Carefully analyze these three elements, paying attention to the following:
1. What specific changes were made between the original and new post?
2. How did the user respond to these changes?
3. Is there a clear pattern or preference expressed by the user?
4. Could this preference be generalized into a rule for future posts?

Based on your analysis, decide if a new rule should be created. Consider the following:
1. Is the change specific enough to be applied consistently?
2. Would applying this change automatically improve future posts?
3. Is there any potential downside to always making this change?

If you determine that a new rule should be created, formulate it clearly and concisely. The rule should be specific enough to be applied consistently but general enough to cover similar situations in the future.
You should not be generating a rule which is specific to this post, like business logic. The rule, if created, should be applicable to any future post.

Provide your analysis and decision in the following format:

<analysis>
[Your detailed analysis of the changes and user response]
</analysis>

<decision>
[Your decision on whether a new rule should be created, along with your reasoning]
</decision>

If applicable, call the 'new_rule' tool to create the new rule. If no new rule is needed, simply write "No new rule required."

Remember to be thorough in your analysis, clear in your decision-making, and precise in your rule formulation if one is needed."""


REFLECTIONS_NAMESPACE = ("reflection_rules",)
REFLECTIONS_KEY = "rules"
RULESET_KEY = "ruleset"


async def aget_reflections(store: BaseStore) -> str:
    """Get reflections from the store."""
    reflections = await store.aget(REFLECTIONS_NAMESPACE, REFLECTIONS_KEY)

    if not reflections:
        return "No prompt rules have been created yet."

    ruleset = reflections.value.get(
        RULESET_KEY, "No prompt rules have been created yet."
    )

    return ruleset


async def aput_reflections(store: BaseStore, reflections: str) -> None:
    """Put reflections in the store."""
    await store.aput(REFLECTIONS_NAMESPACE, REFLECTIONS_KEY, {RULESET_KEY: reflections})


async def reflection(state: State, store: BaseStore) -> Dict[str, Any]:
    """Process reflection and update rules based on user interaction."""
    model = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0)

    current_reflections_prompt = await aget_reflections(store)

    update_instructions = """Analyze the following to determine if rules prompt updates are needed:
1. Current rules prompt (current_prompt)
2. Generated social media post (session)
3. User feedback on the post (feedback)

If the user's feedback explicitly requests changes:
1. Create or update rules that directly address the feedback
2. Keep each rule clear, specific, and concise
3. If a new rule conflicts with an existing one, use the new rule
4. Only add rules that are explicitly mentioned in the user's feedback

Guidelines for updates:
- Do not infer or assume rules beyond what's explicitly stated
- Do not add rules based on implicit feedback
- Do not overgeneralize the feedback
- Combine existing rules if it improves clarity without losing specificity

Output only the updated rules prompt, with no additional context or instructions."""

    feedback = state.user_response

    prompt = Prompt(
        name="Update Prompt",
        prompt=current_reflections_prompt,
        update_instructions=update_instructions,
        feedback=feedback,
    )

    sessions = state.original_post

    optimizer = create_prompt_optimizer(model, kind="metaprompt")

    result = await optimizer(sessions, prompt)

    await aput_reflections(store, result)

    return {}


# Define a new graph
workflow = StateGraph(State)
workflow.add_node("reflection", reflection)
workflow.add_edge("__start__", "reflection")

graph = workflow.compile()
graph.name = "Reflection Graph"
