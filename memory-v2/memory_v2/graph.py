from typing import Any, Dict, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph

from memory_v2.state import State
from langmem.prompts.looping import create_prompt_optimizer, MetapromptOptimizerConfig

REFLECTION_PROMPT = """You are an AI assistant tasked with analyzing social media post revisions and user feedback to determine if a new rule should be created for future post modifications.
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


async def reflection(state: State, config: RunnableConfig) -> Dict[str, Any]:
    """Process reflection and update rules based on user interaction."""
    if not config.get("store"):
        raise ValueError("No store provided")

    model = ChatAnthropic(
        model="claude-3-sonnet-20240229",
        temperature=0
    )

    # Format the reflection prompt
    formatted_prompt = (
        REFLECTION_PROMPT.replace("{ORIGINAL_POST}", state.original_post)
        .replace("{NEW_POST}", state.new_post)
        .replace("{USER_RESPONSE}", state.user_response)
    )

    optimizer_config = MetapromptOptimizerConfig(
        # TODO: Update reflection prompt to replace variables with values before passing.
        metaprompt=REFLECTION_PROMPT,
        max_reflection_steps=3,
        min_reflection_steps=1,
    )

    optimizer = create_prompt_optimizer(model, kind="metaprompt", config=optimizer_config)

    result = await optimizer.ainvoke([{
        "role": "user",
        "content": formatted_prompt
    }])

    # TODO: SAVE RESULTS TO STORE!!

    return {}

# Define a new graph
workflow = StateGraph(State)
workflow.add_node("reflection", reflection)
workflow.add_edge("__start__", "reflection")

graph = workflow.compile()
graph.name = "Reflection Graph"
