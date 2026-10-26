export const NEBIUS_MODEL_DETAILS: Record<string, { name: string; summary: string }> = {
  "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B": {
    name: "NVIDIA Nemotron 3 Nano 30B",
    summary: "Fast, cost-efficient coding and repository questions",
  },
  "Qwen/Qwen3-30B-A3B-Instruct-2507": {
    name: "Qwen3 30B Instruct",
    summary: "Balanced instruction following and code analysis",
  },
  "Qwen/Qwen3-235B-A22B-Instruct-2507": {
    name: "Qwen3 235B Instruct",
    summary: "Higher-capability reasoning for complex repositories",
  },
  "deepseek-ai/DeepSeek-V4-Flash-0731": {
    name: "DeepSeek V4 Flash",
    summary: "Fast advanced reasoning and code assistance",
  },
  "openai/gpt-oss-120b": {
    name: "GPT-OSS 120B",
    summary: "Large open-weight model for demanding analysis",
  },
};

export function getNebiusModelDetails(modelId: string) {
  return NEBIUS_MODEL_DETAILS[modelId] ?? {
    name: modelId.split("/").pop() || modelId,
    summary: "Premium AI model",
  };
}
