import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Markdown } from "~/components/deer-flow/markdown";
import { cn } from "~/lib/utils";
import type { ModelComparisonResults, ModelOutput } from "~/core/messages/types";

interface MultiModelComparisonBlockProps {
  comparisonResults: ModelComparisonResults;
  className?: string;
}

export function MultiModelComparisonBlock({ 
  comparisonResults, 
  className 
}: MultiModelComparisonBlockProps) {
  const [selectedMetric, setSelectedMetric] = useState("total_score");
  const [blindMode, setBlindMode] = useState(false);
  const [customWeights, setCustomWeights] = useState({
    accuracy: 40,
    completeness: 30,
    readability: 30
  });

  const sortedModels = useMemo(() => {
    return comparisonResults.ranking.sort((a, b) => b.total_score - a.total_score);
  }, [comparisonResults]);

  const recalculateScores = (weights: typeof customWeights) => {
    const total = weights.accuracy + weights.completeness + weights.readability;
    const normalizedWeights = {
      accuracy: weights.accuracy / total,
      completeness: weights.completeness / total,
      readability: weights.readability / total
    };

    return Object.entries(comparisonResults.detailed_comparison).map(([modelId, output]) => {
      const newScore = 
        output.evaluation_scores.faithfulness_score * normalizedWeights.accuracy +
        output.evaluation_scores.logic_score * normalizedWeights.completeness +
        output.evaluation_scores.information_density * normalizedWeights.readability;
      
      return { model_id: modelId, total_score: newScore };
    }).sort((a, b) => b.total_score - a.total_score);
  };

  const customRanking = useMemo(() => {
    return recalculateScores(customWeights);
  }, [customWeights, comparisonResults]);

  const getModelDisplayName = (modelId: string, index: number) => {
    return blindMode ? `模型 ${index + 1}` : modelId;
  };

  const highlightDifferences = (text1: string, text2: string) => {
    const words1 = text1.split(' ');
    const words2 = text2.split(' ');
    const maxLength = Math.max(words1.length, words2.length);
    
    const highlighted = [];
    for (let i = 0; i < maxLength; i++) {
      const word1 = words1[i] || '';
      const word2 = words2[i] || '';
      
      if (word1 !== word2) {
        highlighted.push(`<mark>${word1}</mark>`);
      } else {
        highlighted.push(word1);
      }
    }
    
    return highlighted.join(' ');
  };

  return (
    <div className={cn("w-full", className)}>
      <Card>
        <CardHeader>
          <CardTitle>多模型对比结果</CardTitle>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">
              {Object.keys(comparisonResults.detailed_comparison).length} 个模型
            </Badge>
            <Badge variant="outline">
              最佳模型: {blindMode ? "模型 1" : comparisonResults.summary.best_model}
            </Badge>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setBlindMode(!blindMode)}
            >
              {blindMode ? "显示模型标签" : "盲测模式"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">并排对比</TabsTrigger>
              <TabsTrigger value="metrics">评估指标</TabsTrigger>
              <TabsTrigger value="ranking">模型排名</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(comparisonResults.detailed_comparison).map(([modelId, output], index) => (
                  <Card key={modelId} className="h-96">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {getModelDisplayName(modelId, index)}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1 text-xs text-gray-500">
                        <Badge variant="secondary" className="text-xs">
                          延迟: {output.execution_metrics.latency.toFixed(2)}s
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          成本: ${output.execution_metrics.cost.toFixed(4)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          评分: {output.evaluation_scores.total_score.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="overflow-y-auto h-64 p-3">
                      <Markdown className="text-sm prose prose-sm max-w-none">
                        {output.normalized_output}
                      </Markdown>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">自定义评分权重</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>准确性</span>
                        <span>{customWeights.accuracy}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={customWeights.accuracy}
                        onChange={(e) => setCustomWeights(prev => ({
                          ...prev,
                          accuracy: parseInt(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>完整性</span>
                        <span>{customWeights.completeness}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={customWeights.completeness}
                        onChange={(e) => setCustomWeights(prev => ({
                          ...prev,
                          completeness: parseInt(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>可读性</span>
                        <span>{customWeights.readability}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={customWeights.readability}
                        onChange={(e) => setCustomWeights(prev => ({
                          ...prev,
                          readability: parseInt(e.target.value)
                        }))}
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      总计: {customWeights.accuracy + customWeights.completeness + customWeights.readability}%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">性能指标概览</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>平均延迟:</span>
                        <span>{comparisonResults.summary.average_latency.toFixed(2)}s</span>
                      </div>
                      <div className="flex justify-between">
                        <span>总成本:</span>
                        <span>${comparisonResults.summary.total_cost.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>参与模型:</span>
                        <span>{comparisonResults.summary.total_models}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">详细评估指标</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">模型</th>
                          <th className="text-center p-2">事实一致性</th>
                          <th className="text-center p-2">逻辑严谨性</th>
                          <th className="text-center p-2">信息密度</th>
                          <th className="text-center p-2">总分</th>
                          <th className="text-center p-2">延迟</th>
                          <th className="text-center p-2">成本</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(comparisonResults.detailed_comparison).map(([modelId, output], index) => (
                          <tr key={modelId} className="border-b">
                            <td className="p-2 font-medium">
                              {getModelDisplayName(modelId, index)}
                            </td>
                            <td className="text-center p-2">
                              {output.evaluation_scores.faithfulness_score.toFixed(2)}
                            </td>
                            <td className="text-center p-2">
                              {output.evaluation_scores.logic_score.toFixed(2)}
                            </td>
                            <td className="text-center p-2">
                              {output.evaluation_scores.information_density.toFixed(2)}
                            </td>
                            <td className="text-center p-2 font-semibold">
                              {output.evaluation_scores.total_score.toFixed(2)}
                            </td>
                            <td className="text-center p-2">
                              {output.execution_metrics.latency.toFixed(2)}s
                            </td>
                            <td className="text-center p-2">
                              ${output.execution_metrics.cost.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ranking" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">默认排名</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {sortedModels.map((model, index) => (
                        <div key={model.model_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">
                              {getModelDisplayName(model.model_id, index)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold">
                            {model.total_score.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">自定义权重排名</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customRanking.map((model, index) => (
                        <div key={model.model_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">
                              {getModelDisplayName(model.model_id, index)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold">
                            {model.total_score.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
