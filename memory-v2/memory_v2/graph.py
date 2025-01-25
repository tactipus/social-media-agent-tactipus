from typing import Any, Dict, Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph

from memory_v2.state import State

# Constants - you'll need to define these elsewhere
REFLECTION_PROMPT = ""  # Define your prompt template
UPDATE_RULES_PROMPT = ""  # Define your prompt template
RULESET_KEY = "rules"  # Define your ruleset key

new_rule_schema = {
    "type": "object",
    "properties": {
        "newRule": {"type": "string", "description": "The new rule to be added"}
    }
}

update_ruleset_schema = {
    "type": "object",
    "properties": {
        "updatedRuleset": {
            "type": "array",
            "items": {"type": "string"},
            "description": "The updated list of rules"
        }
    }
}

async def reflection(state: State, config: RunnableConfig) -> Dict[str, Any]:
    """Process reflection and update rules based on user interaction."""
    if not config.get("store"):
        raise ValueError("No store provided")

    model = ChatAnthropic(
        model="claude-3-sonnet-20240229",
        temperature=0
    )

    # Create model with tool binding for new rule generation
    generate_new_rule_model = model.bind_tools([{
        "name": "new_rule",
        "description": "Create a new rule based on the provided text. Only call this tool if a new rule is needed.",
        "schema": new_rule_schema
    }])

    # Format the reflection prompt
    formatted_prompt = (
        REFLECTION_PROMPT.replace("{ORIGINAL_POST}", state.original_post)
        .replace("{NEW_POST}", state.new_post)
        .replace("{USER_RESPONSE}", state.user_response)
    )

    # Generate new rule if needed
    result = await generate_new_rule_model.ainvoke([{
        "role": "user",
        "content": formatted_prompt
    }])

    tool_calls = getattr(result, "tool_calls", [])
    if not tool_calls:
        return {}

    new_rule = tool_calls[0].args.get("newRule")
    if not new_rule:
        return {}

    # Get existing rules
    existing_rules = await getReflections(config)

    if not existing_rules or not existing_rules.get("value", {}).get(RULESET_KEY):
        # No rules exist yet. Create and return early
        await putReflections(config, [new_rule])
        return {}

    # Update ruleset with new rule
    update_ruleset_model = model.with_structured_output(
        update_ruleset_schema,
        name="update_ruleset"
    )

    update_ruleset_prompt = (
        UPDATE_RULES_PROMPT.replace(
            "{EXISTING_RULES}",
            "\n".join(existing_rules["value"][RULESET_KEY])
        )
        .replace("{NEW_RULE}", new_rule)
    )

    update_ruleset_result = await update_ruleset_model.ainvoke([{
        "role": "user",
        "content": update_ruleset_prompt
    }])

    await putReflections(config, update_ruleset_result["updatedRuleset"])

    return {}

# Define a new graph
workflow = StateGraph(State)
workflow.add_node("reflection", reflection)
workflow.add_edge("__start__", "reflection")

graph = workflow.compile()
graph.name = "Reflection Graph"
