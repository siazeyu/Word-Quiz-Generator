import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTextbooks,
  useCreateTextbook,
  useUpdateTextbook,
  useDeleteTextbook,
  useListUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
  useListWords,
  useCreateWord,
  useUpdateWord,
  useDeleteWord,
  useImportWords,
  useGetStatsSummary,
  getListTextbooksQueryKey,
  getListUnitsQueryKey,
  getListWordsQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import type { Textbook, Unit, Word } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

type WordRow = { english: string; chinese: string; phonetic?: string; partOfSpeech?: string; orderIndex: number };

async function reorderApi(endpoint: string, items: { id: number; orderIndex: number }[]) {
  await fetch(`/api/${endpoint}/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export default function HomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTextbookId, setSelectedTextbookId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [editingTextbook, setEditingTextbook] = useState<Textbook | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [newTextbookName, setNewTextbookName] = useState("");
  const [newUnitName, setNewUnitName] = useState("");
  const [showAddWord, setShowAddWord] = useState(false);
  const [wordForm, setWordForm] = useState({ english: "", chinese: "", phonetic: "", partOfSpeech: "" });

  const { data: textbooks = [] } = useListTextbooks();
  const { data: units = [] } = useListUnits(selectedTextbookId!, {
    query: { enabled: !!selectedTextbookId, queryKey: getListUnitsQueryKey(selectedTextbookId!) },
  });
  const { data: words = [] } = useListWords(selectedUnitId!, {
    query: { enabled: !!selectedUnitId, queryKey: getListWordsQueryKey(selectedUnitId!) },
  });
  const { data: stats } = useGetStatsSummary({
    query: { queryKey: getGetStatsSummaryQueryKey() },
  });

  const createTextbook = useCreateTextbook();
  const updateTextbook = useUpdateTextbook();
  const deleteTextbook = useDeleteTextbook();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const createWord = useCreateWord();
  const updateWord = useUpdateWord();
  const deleteWord = useDeleteWord();
  const importWords = useImportWords();

  function invalidateTextbooks() {
    queryClient.invalidateQueries({ queryKey: getListTextbooksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
  }
  function invalidateUnits() {
    if (selectedTextbookId) queryClient.invalidateQueries({ queryKey: getListUnitsQueryKey(selectedTextbookId) });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
  }
  function invalidateWords() {
    if (selectedUnitId) queryClient.invalidateQueries({ queryKey: getListWordsQueryKey(selectedUnitId) });
    queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
  }

  function handleAddTextbook() {
    if (!newTextbookName.trim()) return;
    createTextbook.mutate(
      { data: { name: newTextbookName.trim() } },
      {
        onSuccess: () => {
          setNewTextbookName("");
          invalidateTextbooks();
          toast({ title: "教材已添加" });
        },
      },
    );
  }

  function handleUpdateTextbook() {
    if (!editingTextbook) return;
    updateTextbook.mutate(
      { id: editingTextbook.id, data: { name: editingTextbook.name } },
      {
        onSuccess: () => {
          setEditingTextbook(null);
          invalidateTextbooks();
          toast({ title: "教材已更新" });
        },
      },
    );
  }

  function handleDeleteTextbook(id: number) {
    if (!confirm("确定删除此教材？将同时删除所有单元和单词。")) return;
    deleteTextbook.mutate(
      { id },
      {
        onSuccess: () => {
          if (selectedTextbookId === id) {
            setSelectedTextbookId(null);
            setSelectedUnitId(null);
          }
          invalidateTextbooks();
          toast({ title: "教材已删除" });
        },
      },
    );
  }

  const handleMoveTextbook = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= textbooks.length) return;
      const a = textbooks[idx]!;
      const b = textbooks[target]!;
      const newItems = textbooks.map((t, i) => ({
        id: t.id,
        orderIndex: i === idx ? b.orderIndex : i === target ? a.orderIndex : t.orderIndex,
      }));
      await reorderApi("textbooks", [
        { id: a.id, orderIndex: b.orderIndex },
        { id: b.id, orderIndex: a.orderIndex },
      ]);
      queryClient.setQueryData(getListTextbooksQueryKey(), () =>
        [...textbooks].map((t, i) => (i === idx ? { ...t, orderIndex: b.orderIndex } : i === target ? { ...t, orderIndex: a.orderIndex } : t))
          .sort((x, y) => x.orderIndex - y.orderIndex || x.id - y.id),
      );
      void newItems;
    },
    [textbooks, queryClient],
  );

  function handleAddUnit() {
    if (!newUnitName.trim() || !selectedTextbookId) return;
    createUnit.mutate(
      { textbookId: selectedTextbookId, data: { name: newUnitName.trim(), orderIndex: units.length } },
      {
        onSuccess: () => {
          setNewUnitName("");
          invalidateUnits();
          toast({ title: "单元已添加" });
        },
      },
    );
  }

  function handleUpdateUnit() {
    if (!editingUnit) return;
    updateUnit.mutate(
      { id: editingUnit.id, data: { name: editingUnit.name } },
      {
        onSuccess: () => {
          setEditingUnit(null);
          invalidateUnits();
          toast({ title: "单元已更新" });
        },
      },
    );
  }

  function handleDeleteUnit(id: number) {
    if (!confirm("确定删除此单元？将同时删除所有单词。")) return;
    deleteUnit.mutate(
      { id },
      {
        onSuccess: () => {
          if (selectedUnitId === id) setSelectedUnitId(null);
          invalidateUnits();
          toast({ title: "单元已删除" });
        },
      },
    );
  }

  const handleMoveUnit = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= units.length) return;
      const a = units[idx]!;
      const b = units[target]!;
      await reorderApi("units", [
        { id: a.id, orderIndex: b.orderIndex },
        { id: b.id, orderIndex: a.orderIndex },
      ]);
      if (selectedTextbookId) {
        queryClient.setQueryData(getListUnitsQueryKey(selectedTextbookId), () =>
          [...units].map((u, i) => (i === idx ? { ...u, orderIndex: b.orderIndex } : i === target ? { ...u, orderIndex: a.orderIndex } : u))
            .sort((x, y) => x.orderIndex - y.orderIndex || x.id - y.id),
        );
      }
    },
    [units, selectedTextbookId, queryClient],
  );

  function handleAddWord() {
    if (!wordForm.english.trim() || !wordForm.chinese.trim() || !selectedUnitId) return;
    createWord.mutate(
      {
        unitId: selectedUnitId,
        data: {
          english: wordForm.english.trim(),
          chinese: wordForm.chinese.trim(),
          phonetic: wordForm.phonetic.trim() || null,
          partOfSpeech: wordForm.partOfSpeech.trim() || null,
          orderIndex: words.length,
        },
      },
      {
        onSuccess: () => {
          setWordForm({ english: "", chinese: "", phonetic: "", partOfSpeech: "" });
          setShowAddWord(false);
          invalidateWords();
          toast({ title: "单词已添加" });
        },
      },
    );
  }

  function handleUpdateWord(word: Word) {
    updateWord.mutate(
      {
        id: word.id,
        data: {
          english: word.english,
          chinese: word.chinese,
          phonetic: word.phonetic || null,
          partOfSpeech: word.partOfSpeech || null,
        },
      },
      {
        onSuccess: () => {
          setEditingWord(null);
          invalidateWords();
          toast({ title: "单词已更新" });
        },
      },
    );
  }

  function handleDeleteWord(id: number) {
    deleteWord.mutate(
      { id },
      {
        onSuccess: () => {
          invalidateWords();
          toast({ title: "单词已删除" });
        },
      },
    );
  }

  const handleMoveWord = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= words.length) return;
      const a = words[idx]!;
      const b = words[target]!;
      await reorderApi("words", [
        { id: a.id, orderIndex: b.orderIndex },
        { id: b.id, orderIndex: a.orderIndex },
      ]);
      if (selectedUnitId) {
        queryClient.setQueryData(getListWordsQueryKey(selectedUnitId), () =>
          [...words].map((w, i) => (i === idx ? { ...w, orderIndex: b.orderIndex } : i === target ? { ...w, orderIndex: a.orderIndex } : w))
            .sort((x, y) => x.orderIndex - y.orderIndex || x.id - y.id),
        );
      }
    },
    [words, selectedUnitId, queryClient],
  );

  function handleExportExcel() {
    if (!selectedUnitId) return;
    const unit = units.find((u) => u.id === selectedUnitId);
    const rows = words.map((w) => ({
      英语: w.english,
      中文: w.chinese,
      音标: w.phonetic ?? "",
      词性: w.partOfSpeech ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, unit?.name ?? "单词");
    XLSX.writeFile(wb, `${unit?.name ?? "单词"}.xlsx`);
    toast({ title: "已导出Excel文件" });
  }

  function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedUnitId) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]!];
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws!);
      const importedWords: WordRow[] = rows
        .filter((r) => r["英语"] && r["中文"])
        .map((r, i) => ({
          english: String(r["英语"] ?? "").trim(),
          chinese: String(r["中文"] ?? "").trim(),
          phonetic: String(r["音标"] ?? "").trim() || undefined,
          partOfSpeech: String(r["词性"] ?? "").trim() || undefined,
          orderIndex: words.length + i,
        }));
      if (importedWords.length === 0) {
        toast({ title: "未找到有效数据", description: "请确保表头包含：英语、中文、音标、词性", variant: "destructive" });
        return;
      }
      importWords.mutate(
        { data: { unitId: selectedUnitId, words: importedWords } },
        {
          onSuccess: (result) => {
            invalidateWords();
            toast({ title: `已导入 ${result.imported} 个单词` });
          },
        },
      );
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Textbooks */}
      <aside className="no-print w-56 bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden">
        <div className="p-3 border-b border-sidebar-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">教材</h2>
          <div className="flex gap-1">
            <input
              className="flex-1 text-xs border border-input rounded px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="添加教材..."
              value={newTextbookName}
              onChange={(e) => setNewTextbookName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTextbook()}
            />
            <button
              onClick={handleAddTextbook}
              className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:opacity-90 transition-opacity"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {textbooks.map((tb, idx) => (
            <div
              key={tb.id}
              className={`group flex items-center px-2 py-2 cursor-pointer text-sm border-b border-sidebar-border/50 transition-colors ${
                selectedTextbookId === tb.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-sidebar-accent"
              }`}
              onClick={() => {
                setSelectedTextbookId(tb.id);
                setSelectedUnitId(null);
              }}
            >
              {/* Sort arrows */}
              <div className="flex flex-col mr-1 opacity-0 group-hover:opacity-100 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveTextbook(idx, -1); }}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                  title="上移"
                >▲</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveTextbook(idx, 1); }}
                  disabled={idx === textbooks.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                  title="下移"
                >▼</button>
              </div>
              {editingTextbook?.id === tb.id ? (
                <input
                  className="flex-1 text-xs border border-input rounded px-1 py-0.5 bg-card focus:outline-none"
                  value={editingTextbook.name}
                  onChange={(e) => setEditingTextbook({ ...editingTextbook, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateTextbook()}
                  onBlur={handleUpdateTextbook}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate text-xs">{tb.name}</span>
              )}
              <div className="hidden group-hover:flex gap-1 ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingTextbook(tb); }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                  title="编辑"
                >✎</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteTextbook(tb.id); }}
                  className="text-muted-foreground hover:text-destructive text-xs"
                  title="删除"
                >✕</button>
              </div>
            </div>
          ))}
          {textbooks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">添加教材开始使用</p>
          )}
        </div>
        {stats && (
          <div className="p-3 border-t border-sidebar-border bg-muted/50">
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{stats.totalTextbooks} 本教材</div>
              <div>{stats.totalUnits} 个单元</div>
              <div>{stats.totalWords} 个单词</div>
            </div>
          </div>
        )}
      </aside>

      {/* Sidebar - Units */}
      <aside className="no-print w-48 bg-card border-r border-border flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {selectedTextbookId ? "单元" : "选择教材"}
          </h2>
          {selectedTextbookId && (
            <div className="flex gap-1">
              <input
                className="flex-1 text-xs border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="添加单元..."
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddUnit()}
              />
              <button
                onClick={handleAddUnit}
                className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:opacity-90"
              >
                +
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {units.map((unit, idx) => (
            <div
              key={unit.id}
              className={`group flex items-center px-2 py-2 cursor-pointer text-sm border-b border-border/50 transition-colors ${
                selectedUnitId === unit.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedUnitId(unit.id)}
            >
              {/* Sort arrows */}
              <div className="flex flex-col mr-1 opacity-0 group-hover:opacity-100 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveUnit(idx, -1); }}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                  title="上移"
                >▲</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoveUnit(idx, 1); }}
                  disabled={idx === units.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                  title="下移"
                >▼</button>
              </div>
              {editingUnit?.id === unit.id ? (
                <input
                  className="flex-1 text-xs border border-input rounded px-1 py-0.5 bg-background focus:outline-none"
                  value={editingUnit.name}
                  onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateUnit()}
                  onBlur={handleUpdateUnit}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate text-xs">{unit.name}</span>
              )}
              <div className="hidden group-hover:flex gap-1 ml-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingUnit(unit); }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >✎</button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteUnit(unit.id); }}
                  className="text-muted-foreground hover:text-destructive text-xs"
                >✕</button>
              </div>
            </div>
          ))}
          {selectedTextbookId && units.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">添加单元</p>
          )}
        </div>
      </aside>

      {/* Main Content - Words */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {selectedUnitId ? (
          <>
            <div className="no-print px-4 py-3 border-b border-border flex items-center justify-between bg-card">
              <div>
                <h1 className="font-semibold text-foreground">
                  {units.find((u) => u.id === selectedUnitId)?.name ?? ""}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">{words.length} 个单词</p>
              </div>
              <div className="flex gap-2 items-center">
                <label className="cursor-pointer px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors">
                  导入Excel
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportExcel} />
                </label>
                <button
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors"
                >
                  导出Excel
                </button>
                <button
                  onClick={() => setShowAddWord(true)}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  + 添加单词
                </button>
              </div>
            </div>

            {/* Excel format hint */}
            <div className="no-print px-4 py-2 bg-muted/30 border-b border-border">
              <p className="text-xs text-muted-foreground">
                Excel格式：列名需为 <code className="bg-muted px-1 rounded">英语</code>、
                <code className="bg-muted px-1 rounded">中文</code>、
                <code className="bg-muted px-1 rounded">音标</code>（可选）、
                <code className="bg-muted px-1 rounded">词性</code>（可选）
              </p>
            </div>

            {/* Add word form */}
            {showAddWord && (
              <div className="no-print px-4 py-3 bg-primary/5 border-b border-border">
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">英语 *</label>
                    <input
                      className="border border-input rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-32"
                      placeholder="English"
                      value={wordForm.english}
                      onChange={(e) => setWordForm({ ...wordForm, english: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">中文 *</label>
                    <input
                      className="border border-input rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-28"
                      placeholder="中文"
                      value={wordForm.chinese}
                      onChange={(e) => setWordForm({ ...wordForm, chinese: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">音标</label>
                    <input
                      className="border border-input rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-28"
                      placeholder="/fəʊˈnetɪk/"
                      value={wordForm.phonetic}
                      onChange={(e) => setWordForm({ ...wordForm, phonetic: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">词性</label>
                    <input
                      className="border border-input rounded px-2 py-1.5 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-20"
                      placeholder="n./v./adj."
                      value={wordForm.partOfSpeech}
                      onChange={(e) => setWordForm({ ...wordForm, partOfSpeech: e.target.value })}
                    />
                  </div>
                  <button
                    onClick={handleAddWord}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:opacity-90"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => setShowAddWord(false)}
                    className="px-4 py-1.5 border border-border rounded text-sm hover:bg-muted"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {/* Words table */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="no-print sticky top-0 bg-card border-b border-border">
                  <tr>
                    <th className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground w-12">排序</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-8">#</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">英语</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">中文</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">音标</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">词性</th>
                    <th className="no-print text-left px-4 py-2 text-xs font-semibold text-muted-foreground w-20">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((word, idx) => (
                    <tr key={word.id} className="border-b border-border/50 hover:bg-muted/30 group">
                      {/* Sort arrows */}
                      <td className="px-2 py-2">
                        <div className="flex flex-col opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleMoveWord(idx, -1)}
                            disabled={idx === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                            title="上移"
                          >▲</button>
                          <button
                            onClick={() => handleMoveWord(idx, 1)}
                            disabled={idx === words.length - 1}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-20 leading-none text-[10px]"
                            title="下移"
                          >▼</button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                      {editingWord?.id === word.id ? (
                        <>
                          <td className="px-4 py-1.5">
                            <input
                              className="border border-input rounded px-2 py-1 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-full"
                              value={editingWord.english}
                              onChange={(e) => setEditingWord({ ...editingWord, english: e.target.value })}
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              className="border border-input rounded px-2 py-1 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-full"
                              value={editingWord.chinese}
                              onChange={(e) => setEditingWord({ ...editingWord, chinese: e.target.value })}
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              className="border border-input rounded px-2 py-1 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-full"
                              value={editingWord.phonetic ?? ""}
                              onChange={(e) => setEditingWord({ ...editingWord, phonetic: e.target.value })}
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <input
                              className="border border-input rounded px-2 py-1 text-sm bg-card focus:outline-none focus:ring-1 focus:ring-ring w-full"
                              value={editingWord.partOfSpeech ?? ""}
                              onChange={(e) => setEditingWord({ ...editingWord, partOfSpeech: e.target.value })}
                            />
                          </td>
                          <td className="px-4 py-1.5">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleUpdateWord(editingWord)}
                                className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs hover:opacity-90"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingWord(null)}
                                className="px-2 py-1 border border-border rounded text-xs hover:bg-muted"
                              >
                                取消
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2 font-medium">{word.english}</td>
                          <td className="px-4 py-2 text-muted-foreground">{word.chinese}</td>
                          <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{word.phonetic ?? ""}</td>
                          <td className="px-4 py-2 text-muted-foreground text-xs italic">{word.partOfSpeech ?? ""}</td>
                          <td className="no-print px-4 py-2">
                            <div className="hidden group-hover:flex gap-1">
                              <button
                                onClick={() => setEditingWord(word)}
                                className="px-2 py-1 text-xs border border-border rounded hover:bg-muted"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleDeleteWord(word.id)}
                                className="px-2 py-1 text-xs border border-destructive/30 text-destructive rounded hover:bg-destructive/10"
                              >
                                删除
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {words.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  暂无单词，点击"+ 添加单词"或导入Excel
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-lg font-semibold text-foreground mb-2">选择单元开始管理单词</h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                从左侧选择教材和单元，或新建教材和单元来管理你的单词列表。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
