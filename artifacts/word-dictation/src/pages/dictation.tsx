import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTextbooks,
  useListUnits,
  useGenerateDictationPreview,
  getListUnitsQueryKey,
} from "@workspace/api-client-react";
import type { DictationItem } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Direction = "zh_to_en" | "en_to_zh";
type Style = "underline" | "table";

export default function DictationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedUnitIds, setSelectedUnitIds] = useState<number[]>([]);
  const [expandedTextbooks, setExpandedTextbooks] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState<Direction>("zh_to_en");
  const [style, setStyle] = useState<Style>("underline");
  const [shuffle, setShuffle] = useState(false);
  const [showPhonetic, setShowPhonetic] = useState(true);
  const [title, setTitle] = useState("英语默写练习");
  const [columns, setColumns] = useState(2);
  const [sheetData, setSheetData] = useState<{
    title: string;
    direction: string;
    style: string;
    items: DictationItem[];
    generatedAt: string;
  } | null>(null);

  const { data: textbooks = [] } = useListTextbooks();

  const generatePreview = useGenerateDictationPreview();

  function getUnitsForTextbook(textbookId: number) {
    return queryClient.getQueryData<ReturnType<typeof useListUnits>["data"]>(
      getListUnitsQueryKey(textbookId),
    ) ?? [];
  }

  function toggleTextbook(tbId: number) {
    setExpandedTextbooks((prev) => {
      const next = new Set(prev);
      if (next.has(tbId)) {
        next.delete(tbId);
      } else {
        next.add(tbId);
      }
      return next;
    });
  }

  function toggleUnit(unitId: number) {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId],
    );
  }

  function handleGenerate() {
    if (selectedUnitIds.length === 0) {
      toast({ title: "请先选择单元", variant: "destructive" });
      return;
    }
    generatePreview.mutate(
      {
        data: {
          unitIds: selectedUnitIds,
          direction,
          style,
          shuffle,
          showPhonetic,
          title,
          columns,
        },
      },
      {
        onSuccess: (data) => {
          setSheetData(data);
          toast({ title: `已生成 ${data.items.length} 道题` });
        },
        onError: () => {
          toast({ title: "生成失败，请重试", variant: "destructive" });
        },
      },
    );
  }

  function handlePrint() {
    window.print();
  }

  const gridClass =
    columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Controls Panel */}
      <aside className="no-print w-72 bg-card border-r border-border flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-1">默写设置</h2>
          <p className="text-xs text-muted-foreground">配置默写题型和样式</p>
        </div>

        <div className="p-4 space-y-5 flex-1">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">标题</label>
            <input
              className="w-full border border-input rounded px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="默写题目"
            />
          </div>

          {/* Direction */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">默写方向</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDirection("zh_to_en")}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  direction === "zh_to_en"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                汉 → 英
              </button>
              <button
                onClick={() => setDirection("en_to_zh")}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  direction === "en_to_zh"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                英 → 汉
              </button>
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">版面样式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setStyle("underline")}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  style === "underline"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                下划线版
              </button>
              <button
                onClick={() => setStyle("table")}
                className={`flex-1 py-2 text-xs rounded border transition-colors ${
                  style === "table"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                表格版
              </button>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">列数</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((c) => (
                <button
                  key={c}
                  onClick={() => setColumns(c)}
                  className={`flex-1 py-2 text-xs rounded border transition-colors ${
                    columns === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {c}列
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">选项</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPhonetic}
                onChange={(e) => setShowPhonetic(e.target.checked)}
                className="rounded border-input w-4 h-4 accent-primary"
              />
              <span className="text-sm">显示音标</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
                className="rounded border-input w-4 h-4 accent-primary"
              />
              <span className="text-sm">随机打乱顺序</span>
            </label>
          </div>

          {/* Unit Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              选择单元 ({selectedUnitIds.length} 已选)
            </label>
            <div className="border border-border rounded overflow-hidden max-h-64 overflow-y-auto">
              {textbooks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">暂无教材，请先在单词管理中添加</p>
              ) : (
                textbooks.map((tb) => {
                  const tbUnits = getUnitsForTextbook(tb.id);
                  const isExpanded = expandedTextbooks.has(tb.id);
                  return (
                    <div key={tb.id} className="border-b border-border/50 last:border-0">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => {
                          toggleTextbook(tb.id);
                          if (!isExpanded && tbUnits.length === 0) {
                            // Trigger fetch
                            queryClient.fetchQuery({
                              queryKey: getListUnitsQueryKey(tb.id),
                              queryFn: () =>
                                fetch(`/api/textbooks/${tb.id}/units`).then((r) => r.json()),
                            });
                          }
                        }}
                      >
                        <span className="truncate">{tb.name}</span>
                        <span className="ml-1 shrink-0">{isExpanded ? "▾" : "▸"}</span>
                      </button>
                      {isExpanded && (
                        <div>
                          {tbUnits.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-5 py-2">暂无单元</p>
                          ) : (
                            tbUnits.map((unit) => (
                              <label
                                key={unit.id}
                                className="flex items-center gap-2 px-5 py-1.5 text-xs cursor-pointer hover:bg-muted/30"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedUnitIds.includes(unit.id)}
                                  onChange={() => toggleUnit(unit.id)}
                                  className="rounded w-3.5 h-3.5 accent-primary"
                                />
                                <span className="truncate">{unit.name}</span>
                              </label>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={handleGenerate}
            disabled={generatePreview.isPending || selectedUnitIds.length === 0}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generatePreview.isPending ? "生成中..." : "生成默写题"}
          </button>
          {sheetData && (
            <button
              onClick={handlePrint}
              className="w-full py-2.5 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
            >
              打印 / 导出PDF
            </button>
          )}
        </div>
      </aside>

      {/* Preview Area */}
      <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
        {sheetData ? (
          <div className="max-w-4xl mx-auto">
            {/* Screen controls */}
            <div className="no-print flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                预览 — 共 {sheetData.items.length} 题
              </p>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90"
              >
                打印 / 导出PDF
              </button>
            </div>

            {/* Printable sheet */}
            <div
              ref={printRef}
              className="print-area bg-white shadow-sm rounded-lg p-8"
              style={{ fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Arial', sans-serif" }}
            >
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
                <h1 style={{ fontSize: "18pt", fontWeight: "bold", marginBottom: "4px" }}>{sheetData.title}</h1>
                <p style={{ fontSize: "10pt", color: "#666" }}>
                  {sheetData.direction === "zh_to_en" ? "汉译英" : "英译汉"} &nbsp;|&nbsp; 共 {sheetData.items.length} 题
                </p>
              </div>

              {/* Student info line */}
              <div style={{ display: "flex", gap: "32px", marginBottom: "20px", fontSize: "10pt" }}>
                <span>姓名：<span style={{ display: "inline-block", width: "100px", borderBottom: "1px solid #000" }}>&nbsp;</span></span>
                <span>班级：<span style={{ display: "inline-block", width: "80px", borderBottom: "1px solid #000" }}>&nbsp;</span></span>
                <span>日期：<span style={{ display: "inline-block", width: "80px", borderBottom: "1px solid #000" }}>&nbsp;</span></span>
                <span>得分：<span style={{ display: "inline-block", width: "60px", borderBottom: "1px solid #000" }}>&nbsp;</span></span>
              </div>

              {/* Words */}
              {style === "underline" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: "8px 24px",
                  }}
                >
                  {sheetData.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", fontSize: "11pt" }}>
                        <span style={{ color: "#666", minWidth: "22px", fontSize: "9pt" }}>{idx + 1}.</span>
                        <span style={{ fontWeight: "500", minWidth: columns === 3 ? "70px" : "90px" }}>{item.prompt}</span>
                        {item.partOfSpeech && (
                          <span style={{ fontSize: "8pt", color: "#888", fontStyle: "italic" }}>{item.partOfSpeech}</span>
                        )}
                        <span
                          style={{
                            flex: 1,
                            borderBottom: "1px solid #333",
                            minWidth: "60px",
                            display: "inline-block",
                          }}
                        >&nbsp;</span>
                      </div>
                      {item.phonetic && showPhonetic && (
                        <div style={{ paddingLeft: "28px", fontSize: "8pt", color: "#999", marginTop: "1px" }}>
                          {item.phonetic}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "10pt",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f5f5f5" }}>
                      <th style={{ border: "1px solid #ccc", padding: "6px 8px", width: "28px", textAlign: "center", fontWeight: "600" }}>序号</th>
                      <th style={{ border: "1px solid #ccc", padding: "6px 8px", fontWeight: "600" }}>
                        {sheetData.direction === "zh_to_en" ? "中文提示" : "英文提示"}
                      </th>
                      {showPhonetic && (
                        <th style={{ border: "1px solid #ccc", padding: "6px 8px", width: "100px", fontWeight: "600" }}>音标</th>
                      )}
                      <th style={{ border: "1px solid #ccc", padding: "6px 8px", width: "45%", fontWeight: "600" }}>答案（默写处）</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.items.map((item, idx) => (
                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ border: "1px solid #ccc", padding: "7px 8px", textAlign: "center", color: "#666" }}>{idx + 1}</td>
                        <td style={{ border: "1px solid #ccc", padding: "7px 8px" }}>
                          <span style={{ fontWeight: "500" }}>{item.prompt}</span>
                          {item.partOfSpeech && (
                            <span style={{ fontSize: "8pt", color: "#888", fontStyle: "italic", marginLeft: "4px" }}>
                              {item.partOfSpeech}
                            </span>
                          )}
                        </td>
                        {showPhonetic && (
                          <td style={{ border: "1px solid #ccc", padding: "7px 8px", color: "#666", fontSize: "9pt", fontFamily: "monospace" }}>
                            {item.phonetic}
                          </td>
                        )}
                        <td style={{ border: "1px solid #ccc", padding: "7px 8px" }}>&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Footer */}
              <div style={{ marginTop: "24px", paddingTop: "12px", borderTop: "1px solid #ddd", fontSize: "8pt", color: "#aaa", textAlign: "right" }}>
                单词默写生成器 &nbsp;·&nbsp; {new Date(sheetData.generatedAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-lg font-semibold text-foreground mb-2">准备生成默写题</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                在左侧选择单元，配置默写方向和样式，然后点击"生成默写题"按钮查看预览。
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-area {
            display: block !important;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 20mm 15mm;
            box-shadow: none;
            border-radius: 0;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
}
