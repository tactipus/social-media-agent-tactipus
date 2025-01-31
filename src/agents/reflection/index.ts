import {
  Annotation,
  END,
  LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  getReflectionsPrompt,
  putReflectionsPrompt,
} from "../../utils/reflections.js";
import { Client } from "@langchain/langgraph-sdk";

const ReflectionAnnotation = Annotation.Root({
  /**
   * The original post before edits were made.
   */
  originalPost: Annotation<string>,
  /**
   * The post after edits have been made.
   */
  newPost: Annotation<string>,
  /**
   * The user's response to the interrupt event
   * which triggered the reflection.
   */
  userResponse: Annotation<string>,
});

const UPDATE_INSTRUCTIONS = `Analyze the following to determine if rules prompt updates are needed:
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

Output only the updated rules prompt, with no additional context or instructions.`;

async function reflection(
  state: typeof ReflectionAnnotation.State,
  config: LangGraphRunnableConfig,
): Promise<Partial<typeof ReflectionAnnotation.State>> {
  if (!config.store) {
    throw new Error("No store provided");
  }

  const langMemClient = new Client({
    apiUrl:
      "https://langmem-v0-544fccf4898a5e3c87bdca29b5f9ab21.us.langgraph.app",
  });

  const existingRules = await getReflectionsPrompt(config);

  const conversation = [{ role: "assistant", content: state.originalPost }];
  const feedback = {
    user_feedback: state.userResponse,
  };
  const threads = [[conversation, feedback]];

  const { thread_id } = await langMemClient.threads.create();
  console.log("BEFORE AWAITING RUN!");
  const result = await langMemClient.runs.wait(thread_id, "prompt_optimizer", {
    input: {
      prompts: [
        {
          name: "Update Prompt",
          prompt: existingRules,
          when_to_update: "Whenever the user provides feedback.",
          update_instructions: UPDATE_INSTRUCTIONS,
        },
      ],
      threads: threads,
    },
    config: {
      configurable: { model: "claude-3-5-sonnet-latest", kind: "metaprompt" },
    },
  });

  console.dir(result, { depth: null });

  const updated = (result as Record<string, any>).updated_prompts[0].prompt;

  await putReflectionsPrompt(config, updated);

  return {};
}

const reflectionWorkflow = new StateGraph(ReflectionAnnotation)
  .addNode("reflection", reflection)
  .addEdge(START, "reflection")
  .addEdge("reflection", END);

export const reflectionGraph = reflectionWorkflow.compile();
reflectionGraph.name = "Reflection Graph";
