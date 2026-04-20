import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTextbooks,
  useGenerateDictationPreview,
  getListUnitsQueryKey,
} from "@workspace/api-client-react";
import type { DictationItem } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type Direction = "zh_to_en" | "en_to_zh";
type Style = "underline" | "table";
type SelectMode = "all" | "range" | "random";

interface WordEntry {
  id: number;
  english: string;
  chinese: string;
  phonetic: string | null;
  partOfSpeech: string | null;
  unitId: number;
  orderIndex: number;
}

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
  const [selectMode, setSelectMode] = useState<SelectMode>("all");
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(10);
  const [randomCount, setRandomCount] = useState(10);
  const [sheetData, setSheetData] = useState<{
    title: string;
    direction: string;
    style: string;
    items: DictationItem[];
    generatedAt: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: textbooks = [] } = useListTextbooks();

  const generatePreview = useGenerateDictationPreview();

  function getUnitsForTextbook(textbookId: number) {
    return (queryClient.getQueryData<{ id: number; name: string }[]>(getListUnitsQueryKey(textbookId)) ?? []);
  }

  function toggleTextbook(tbId: number) {
    setExpandedTextbooks((prev) => {
      const next = new Set(prev);
      if (next.has(tbId)) {
        next.delete(tbId);
      } else {
        next.add(tbId);
        // fetch units if not cached
        const cached = queryClient.getQueryData(getListUnitsQueryKey(tbId));
        if (!cached) {
          queryClient.fetchQuery({
            queryKey: getListUnitsQueryKey(tbId),
            queryFn: () => fetch(`/api/textbooks/${tbId}/units`).then((r) => r.json()),
          });
        }
      }
      return next;
    });
  }

  function toggleUnit(unitId: number) {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId],
    );
  }

  async function fetchAllWords(unitIds: number[]): Promise<WordEntry[]> {
    const results = await Promise.all(
      unitIds.map((uid) =>
        fetch(`/api/units/${uid}/words`)
          .then((r) => r.json())
          .then((ws: WordEntry[]) => ws),
      ),
    );
    return results.flat();
  }

  async function handleGenerate() {
    if (selectedUnitIds.length === 0) {
      toast({ title: "请先选择单元", variant: "destructive" });
      return;
    }

    setGenerating(true);
    try {
      if (selectMode === "all") {
        generatePreview.mutate(
          { data: { unitIds: selectedUnitIds, direction, style, shuffle, showPhonetic, title, columns } },
          {
            onSuccess: (data) => {
              setSheetData(data);
              toast({ title: `已生成 ${data.items.length} 道题` });
            },
            onError: () => toast({ title: "生成失败，请重试", variant: "destructive" }),
            onSettled: () => setGenerating(false),
          },
        );
        return;
      }

      // range or random — fetch all words first
      const allWords = await fetchAllWords(selectedUnitIds);
      allWords.sort((a, b) => {
        const unitDiff = selectedUnitIds.indexOf(a.unitId) - selectedUnitIds.indexOf(b.unitId);
        return unitDiff !== 0 ? unitDiff : a.orderIndex - b.orderIndex;
      });

      let selected: WordEntry[];
      if (selectMode === "range") {
        const from = Math.max(1, rangeFrom) - 1;
        const to = Math.min(allWords.length, rangeTo);
        selected = allWords.slice(from, to);
      } else {
        // random
        const shuffled = [...allWords].sort(() => Math.random() - 0.5);
        selected = shuffled.slice(0, Math.min(randomCount, allWords.length));
      }

      if (selected.length === 0) {
        toast({ title: "所选范围内没有单词", variant: "destructive" });
        setGenerating(false);
        return;
      }

      const res = await fetch("/api/dictation/preview-by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordIds: selected.map((w) => w.id),
          direction,
          style,
          columns,
          showPhonetic,
          title,
          shuffle: selectMode === "all" ? shuffle : false,
        }),
      });
      const data = await res.json();
      setSheetData(data);
      toast({ title: `已生成 ${data.items.length} 道题` });
    } catch {
      toast({ title: "生成失败，请重试", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  // Split items into N columns for rendering
  function splitIntoColumns<T>(arr: T[], n: number): T[][] {
    const perCol = Math.ceil(arr.length / n);
    const cols: T[][] = [];
    for (let i = 0; i < n; i++) {
      cols.push(arr.slice(i * perCol, (i + 1) * perCol));
    }
    return cols.filter((c) => c.length > 0);
  }

  const btnBase = "flex-1 py-2 text-xs rounded border transition-colors";
  const btnActive = "bg-primary text-primary-foreground border-primary";
  const btnInactive = "bg-background border-border hover:bg-muted";

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
              <button onClick={() => setDirection("zh_to_en")} className={`${btnBase} ${direction === "zh_to_en" ? btnActive : btnInactive}`}>汉 → 英</button>
              <button onClick={() => setDirection("en_to_zh")} className={`${btnBase} ${direction === "en_to_zh" ? btnActive : btnInactive}`}>英 → 汉</button>
            </div>
          </div>

          {/* Style */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">版面样式</label>
            <div className="flex gap-2">
              <button onClick={() => setStyle("underline")} className={`${btnBase} ${style === "underline" ? btnActive : btnInactive}`}>下划线版</button>
              <button onClick={() => setStyle("table")} className={`${btnBase} ${style === "table" ? btnActive : btnInactive}`}>表格版</button>
            </div>
          </div>

          {/* Columns */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">列数</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((c) => (
                <button key={c} onClick={() => setColumns(c)} className={`${btnBase} ${columns === c ? btnActive : btnInactive}`}>{c}列</button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">选项</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showPhonetic} onChange={(e) => setShowPhonetic(e.target.checked)} className="rounded border-input w-4 h-4 accent-primary" />
              <span className="text-sm">显示音标</span>
            </label>
            {selectMode === "all" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="rounded border-input w-4 h-4 accent-primary" />
                <span className="text-sm">随机打乱顺序</span>
              </label>
            )}
          </div>

          {/* Unit Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              选择单元 ({selectedUnitIds.length} 已选)
            </label>
            <div className="border border-border rounded overflow-hidden max-h-52 overflow-y-auto">
              {Array.isArray(textbooks) && textbooks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">暂无教材，请先在单词管理中添加</p>
              ) : (
                Array.isArray(textbooks) && textbooks.map((tb) => {
                  const tbUnits = getUnitsForTextbook(tb.id);
                  const isExpanded = expandedTextbooks.has(tb.id);
                  return (
                    <div key={tb.id} className="border-b border-border/50 last:border-0">
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                        onClick={() => toggleTextbook(tb.id)}
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
                              <label key={unit.id} className="flex items-center gap-2 px-5 py-1.5 text-xs cursor-pointer hover:bg-muted/30">
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

          {/* Select Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">选词模式</label>
            <div className="flex gap-1">
              {(["all", "range", "random"] as SelectMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectMode(m)}
                  className={`flex-1 py-1.5 text-xs rounded border transition-colors ${selectMode === m ? btnActive : btnInactive}`}
                >
                  {m === "all" ? "全部" : m === "range" ? "按范围" : "随机抽取"}
                </button>
              ))}
            </div>

            {selectMode === "range" && (
              <div className="bg-muted/30 rounded p-3 space-y-2">
                <p className="text-xs text-muted-foreground">从所选单元的全部单词中按序号范围选取（跨单元连续编号）</p>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">从第</label>
                    <input
                      type="number"
                      min={1}
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(Math.max(1, Number(e.target.value)))}
                      className="w-16 border border-input rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-4">个</span>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">到第</label>
                    <input
                      type="number"
                      min={rangeFrom}
                      value={rangeTo}
                      onChange={(e) => setRangeTo(Math.max(rangeFrom, Number(e.target.value)))}
                      className="w-16 border border-input rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-4">个</span>
                </div>
                <p className="text-xs text-primary">共 {Math.max(0, rangeTo - rangeFrom + 1)} 道题</p>
              </div>
            )}

            {selectMode === "random" && (
              <div className="bg-muted/30 rounded p-3 space-y-2">
                <p className="text-xs text-muted-foreground">从所选单元的全部单词中随机抽取</p>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground shrink-0">抽取数量</label>
                  <input
                    type="number"
                    min={1}
                    value={randomCount}
                    onChange={(e) => setRandomCount(Math.max(1, Number(e.target.value)))}
                    className="w-20 border border-input rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">个单词</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedUnitIds.length === 0}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {generating ? "生成中..." : "生成默写题"}
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
          <div className="max-w-5xl mx-auto">
            {/* Screen controls */}
            <div className="no-print flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">预览 — 共 {sheetData.items.length} 题</p>
              <button onClick={handlePrint} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:opacity-90">
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

              {/* Words — underline style */}
              {sheetData.style === "underline" ? (
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "8px 24px" }}>
                  {sheetData.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", fontSize: "11pt" }}>
                        <span style={{ color: "#666", minWidth: "22px", fontSize: "9pt" }}>{idx + 1}.</span>
                        <span style={{ fontWeight: "500", minWidth: columns === 3 ? "60px" : "80px" }}>{item.prompt}</span>
                        {item.partOfSpeech && (
                          <span style={{ fontSize: "8pt", color: "#888", fontStyle: "italic" }}>{item.partOfSpeech}</span>
                        )}
                        <span style={{ flex: 1, borderBottom: "1px solid #333", minWidth: "50px", display: "inline-block" }}>&nbsp;</span>
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
                /* Table style — split into N column-groups */
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0 16px" }}>
                  {splitIntoColumns(sheetData.items, columns).map((chunk, colIdx) => {
                    const offset = colIdx * Math.ceil(sheetData.items.length / columns);
                    return (
                      <table key={colIdx} style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
                        <thead>
                          <tr style={{ backgroundColor: "#f5f5f5" }}>
                            <th style={{ border: "1px solid #ccc", padding: "4px 6px", width: "22px", textAlign: "center", fontWeight: "600" }}>序</th>
                            <th style={{ border: "1px solid #ccc", padding: "4px 6px", fontWeight: "600" }}>
                              {sheetData.direction === "zh_to_en" ? "中文" : "英文"}
                            </th>
                            {showPhonetic && columns === 1 && (
                              <th style={{ border: "1px solid #ccc", padding: "4px 6px", width: "90px", fontWeight: "600" }}>音标</th>
                            )}
                            <th style={{ border: "1px solid #ccc", padding: "4px 6px", fontWeight: "600" }}>答案（默写）</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.map((item, i) => (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                              <td style={{ border: "1px solid #ccc", padding: "5px 6px", textAlign: "center", color: "#666", fontSize: "8pt" }}>
                                {offset + i + 1}
                              </td>
                              <td style={{ border: "1px solid #ccc", padding: "5px 6px" }}>
                                <span style={{ fontWeight: "500" }}>{item.prompt}</span>
                                {item.partOfSpeech && columns === 1 && (
                                  <span style={{ fontSize: "7pt", color: "#888", fontStyle: "italic", marginLeft: "3px" }}>{item.partOfSpeech}</span>
                                )}
                              </td>
                              {showPhonetic && columns === 1 && (
                                <td style={{ border: "1px solid #ccc", padding: "5px 6px", color: "#666", fontSize: "8pt", fontFamily: "monospace" }}>
                                  {item.phonetic}
                                </td>
                              )}
                              <td style={{ border: "1px solid #ccc", padding: "5px 6px" }}>&nbsp;</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    );
                  })}
                </div>
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
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            background: white !important;
            overflow: visible !important;
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
