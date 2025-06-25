// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { zodResolver } from "@hookform/resolvers/zod";
import { Settings } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Checkbox } from "~/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { SettingsState } from "~/core/store";
import { getModelParams, setModelParams } from "~/core/store";

import type { Tab } from "./types";

const generalFormSchema = z.object({
  autoAcceptedPlan: z.boolean(),
  maxPlanIterations: z.number().min(1, {
    message: "Max plan iterations must be at least 1.",
  }),
  maxStepNum: z.number().min(1, {
    message: "Max step number must be at least 1.",
  }),
  maxSearchResults: z.number().min(1, {
    message: "Max search results must be at least 1.",
  }),
  // Others
  enableBackgroundInvestigation: z.boolean(),
  enableDeepThinking: z.boolean(),
  reportStyle: z.enum(["academic", "popular_science", "news", "social_media"]),
  enableMultiModel: z.boolean(),
  selectedModels: z.array(z.string()).min(3, {
    message: "At least 3 models must be selected for multi-model mode.",
  }),
  evaluationWeights: z.object({
    accuracy: z.number().min(0).max(1),
    completeness: z.number().min(0).max(1),
    readability: z.number().min(0).max(1),
  }),
  modelParams: z.record(z.object({
    temperature: z.number().min(0).max(2).optional(),
    max_tokens: z.number().min(1).max(8192).optional(),
    top_p: z.number().min(0).max(1).optional(),
    frequency_penalty: z.number().min(-2).max(2).optional(),
    presence_penalty: z.number().min(-2).max(2).optional(),
  })).optional(),
});

export const GeneralTab: Tab = ({
  settings,
  onChange,
}: {
  settings: SettingsState;
  onChange: (changes: Partial<SettingsState>) => void;
}) => {
  const availableModels = [
    { id: "qwen1.5-72b", label: "Qwen 1.5 72B" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { id: "deepseek-v3", label: "DeepSeek V3" },
    { id: "claude-3", label: "Claude 3" },
    { id: "doubao-pro", label: "Doubao Pro" },
  ];

  const generalSettings = useMemo(() => settings.general, [settings]);
  const form = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema, undefined, undefined),
    defaultValues: {
      ...generalSettings,
      modelParams: generalSettings.modelParams || {},
    },
    mode: "all",
    reValidateMode: "onBlur",
  });

  const currentSettings = form.watch();
  useEffect(() => {
    let hasChanges = false;
    for (const key in currentSettings) {
      if (
        currentSettings[key as keyof typeof currentSettings] !==
        settings.general[key as keyof SettingsState["general"]]
      ) {
        hasChanges = true;
        break;
      }
    }
    if (hasChanges) {
      onChange({ general: currentSettings } as SettingsState);
    }
  }, [currentSettings, onChange, settings]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-lg font-medium">General</h1>
      </header>
      <main>
        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="autoAcceptedPlan"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="autoAcceptedPlan"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label className="text-sm" htmlFor="autoAcceptedPlan">
                        Allow automatic acceptance of plans
                      </Label>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxPlanIterations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max plan iterations</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    Set to 1 for single-step planning. Set to 2 or more to
                    enable re-planning.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxStepNum"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max steps of a research plan</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    By default, each research plan has 3 steps.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxSearchResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max search results</FormLabel>
                  <FormControl>
                    <Input
                      className="w-60"
                      type="number"
                      defaultValue={field.value}
                      min={1}
                      onChange={(event) =>
                        field.onChange(parseInt(event.target.value || "0"))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    By default, each search step has 3 results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="enableMultiModel"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="enableMultiModel"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <Label className="text-sm" htmlFor="enableMultiModel">
                        Enable multi-model parallel execution
                      </Label>
                    </div>
                  </FormControl>
                  <FormDescription>
                    When enabled, multiple models will run in parallel and provide comparison results.
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="selectedModels"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>Selected Models (minimum 3)</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-2 gap-2">
                        {availableModels.map((model: {id: string, label: string}) => (
                          <div key={model.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={model.id}
                              checked={field.value?.includes(model.id)}
                              onCheckedChange={(checked) => {
                                const currentModels = field.value || [];
                                if (checked) {
                                  field.onChange([...currentModels, model.id]);
                                } else {
                                  field.onChange(currentModels.filter((m: string) => m !== model.id));
                                }
                              }}
                            />
                            <Label htmlFor={model.id} className="text-sm">
                              {model.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select at least 3 models for parallel execution and comparison.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            
            <FormField
              control={form.control}
              name="evaluationWeights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evaluation Weights</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Label className="w-24 text-sm">Accuracy:</Label>
                        <Input
                          className="w-20"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={field.value?.accuracy || 0.4}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              accuracy: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          ({Math.round((field.value?.accuracy || 0.4) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-24 text-sm">Completeness:</Label>
                        <Input
                          className="w-20"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={field.value?.completeness || 0.3}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              completeness: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          ({Math.round((field.value?.completeness || 0.3) * 100)}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-24 text-sm">Readability:</Label>
                        <Input
                          className="w-20"
                          type="number"
                          step="0.1"
                          min="0"
                          max="1"
                          value={field.value?.readability || 0.3}
                          onChange={(e) =>
                            field.onChange({
                              ...field.value,
                              readability: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="text-sm text-muted-foreground">
                          ({Math.round((field.value?.readability || 0.3) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Configure the weights for evaluation metrics. Total should equal 1.0.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Per-model parameter configuration */}
            {form.watch("enableMultiModel") && form.watch("selectedModels")?.length > 0 && (
              <div className="space-y-4">
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Model Parameters Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure individual parameters for each selected model. Leave empty to use default values.
                  </p>
                  
                  <div className="space-y-4">
                    {form.watch("selectedModels")?.map((modelId: string) => {
                      const modelLabel = availableModels.find((m: {id: string, label: string}) => m.id === modelId)?.label || modelId;
                      const currentParams = getModelParams(modelId);
                      
                      return (
                        <Collapsible key={modelId} className="border rounded-lg">
                          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50">
                            <h4 className="font-medium">{modelLabel} Parameters</h4>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 pt-0">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Temperature (0.0-2.0)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="2"
                                  placeholder="0.7"
                                  defaultValue={currentParams.temperature?.toString() || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const params = getModelParams(modelId);
                                    const newParams = { ...params };
                                    if (value) {
                                      newParams.temperature = parseFloat(value);
                                    } else {
                                      delete newParams.temperature;
                                    }
                                    setModelParams(modelId, newParams);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Max Tokens (1-8192)</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="8192"
                                  placeholder="2048"
                                  defaultValue={currentParams.max_tokens?.toString() || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const params = getModelParams(modelId);
                                    const newParams = { ...params };
                                    if (value) {
                                      newParams.max_tokens = parseInt(value);
                                    } else {
                                      delete newParams.max_tokens;
                                    }
                                    setModelParams(modelId, newParams);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Top P (0.0-1.0)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="1"
                                  placeholder="1.0"
                                  defaultValue={currentParams.top_p?.toString() || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const params = getModelParams(modelId);
                                    const newParams = { ...params };
                                    if (value) {
                                      newParams.top_p = parseFloat(value);
                                    } else {
                                      delete newParams.top_p;
                                    }
                                    setModelParams(modelId, newParams);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Frequency Penalty (-2.0-2.0)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="-2"
                                  max="2"
                                  placeholder="0.0"
                                  defaultValue={currentParams.frequency_penalty?.toString() || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const params = getModelParams(modelId);
                                    const newParams = { ...params };
                                    if (value) {
                                      newParams.frequency_penalty = parseFloat(value);
                                    } else {
                                      delete newParams.frequency_penalty;
                                    }
                                    setModelParams(modelId, newParams);
                                  }}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Presence Penalty (-2.0-2.0)</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="-2"
                                  max="2"
                                  placeholder="0.0"
                                  defaultValue={currentParams.presence_penalty?.toString() || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const params = getModelParams(modelId);
                                    const newParams = { ...params };
                                    if (value) {
                                      newParams.presence_penalty = parseFloat(value);
                                    } else {
                                      delete newParams.presence_penalty;
                                    }
                                    setModelParams(modelId, newParams);
                                  }}
                                />
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </main>
    </div>
  );
};
GeneralTab.displayName = "General";
GeneralTab.icon = Settings;
