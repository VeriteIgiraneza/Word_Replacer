import { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Trash2, Copy, Check, Wand2, RotateCcw } from "lucide-react";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [pairs, setPairs] = useState([{ id: 1, find: "", replace: "" }]);
  const [caseInsensitive, setCaseInsensitive] = useState(true);
  const [wholeWord, setWholeWord] = useState(true);
  const [copied, setCopied] = useState(false);

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const output = useMemo(() => {
    let result = transcript;
    for (const pair of pairs) {
      if (!pair.find) continue;
      const flags = caseInsensitive ? "gi" : "g";
      const escaped = escapeRegex(pair.find);
      const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
      try {
        result = result.replace(new RegExp(pattern, flags), pair.replace);
      } catch (e) {}
    }
    return result;
  }, [transcript, pairs, caseInsensitive, wholeWord]);

  const replacementCount = useMemo(() => {
    if (!transcript) return 0;
    let total = 0;
    for (const pair of pairs) {
      if (!pair.find) continue;
      const flags = caseInsensitive ? "gi" : "g";
      const escaped = escapeRegex(pair.find);
      const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
      try {
        const matches = transcript.match(new RegExp(pattern, flags));
        if (matches) total += matches.length;
      } catch (e) {}
    }
    return total;
  }, [transcript, pairs, caseInsensitive, wholeWord]);

  // Refs so the highlight overlay scrolls in sync with the textarea
  const inputMirrorRef = useRef(null);

  // Escape HTML so user input can't break the overlay
  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));

  // Wrap every match of `terms` in <mark> tags
  const buildHighlightHTML = (text, terms) => {
    if (!text) return "";
    const valid = terms.filter((t) => t && t.trim());
    if (!valid.length) return escapeHtml(text);
    const flags = caseInsensitive ? "gi" : "g";
    const escaped = valid.map((t) => escapeRegex(t.trim())).join("|");
    const pattern = wholeWord ? `\\b(${escaped})\\b` : `(${escaped})`;
    let regex;
    try {
      regex = new RegExp(pattern, flags);
    } catch (e) {
      return escapeHtml(text);
    }
    let result = "";
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      result += escapeHtml(text.slice(lastIndex, match.index));
      result += `<mark class="bg-yellow-200 rounded px-0.5 text-stone-900">${escapeHtml(match[0])}</mark>`;
      lastIndex = match.index + match[0].length;
    }
    result += escapeHtml(text.slice(lastIndex));
    return result;
  };

  // Highlight the FIND terms in the original transcript
  const inputHighlightHTML = useMemo(
    () => buildHighlightHTML(transcript, pairs.map((p) => p.find)),
    [transcript, pairs, caseInsensitive, wholeWord]
  );

  // Highlight the REPLACEMENT terms in the cleaned output
  const outputHighlightHTML = useMemo(
    () => buildHighlightHTML(output, pairs.map((p) => p.replace)),
    [output, pairs, caseInsensitive, wholeWord]
  );

  const addPair = () => {
    const nextId = Math.max(...pairs.map((p) => p.id), 0) + 1;
    setPairs([...pairs, { id: nextId, find: "", replace: "" }]);
  };

  const removePair = (id) => {
    if (pairs.length === 1) {
      setPairs([{ id: 1, find: "", replace: "" }]);
    } else {
      setPairs(pairs.filter((p) => p.id !== id));
    }
  };

  const updatePair = (id, field, value) => {
    setPairs(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const detectNames = () => {
    if (!transcript) return;
    const stopwords = new Set([
      "I", "The", "A", "An", "And", "But", "Or", "So", "If", "Then", "When",
      "Where", "What", "Who", "How", "Why", "This", "That", "These", "Those",
      "It", "He", "She", "We", "They", "You", "My", "Your", "His", "Her",
      "Their", "Our", "Yes", "No", "Ok", "Okay", "Well", "Just", "Like",
      "Mr", "Mrs", "Ms", "Dr", "Monday", "Tuesday", "Wednesday", "Thursday",
      "Friday", "Saturday", "Sunday", "January", "February", "March", "April",
      "May", "June", "July", "August", "September", "October", "November",
      "December", "God", "Lord", "Jesus", "Christ",
    ]);
    const counts = {};
    const matches = transcript.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    for (const word of matches) {
      if (stopwords.has(word)) continue;
      counts[word] = (counts[word] || 0) + 1;
    }
    const candidates = Object.entries(counts)
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (candidates.length === 0) return;

    const startId = Math.max(...pairs.map((p) => p.id), 0) + 1;
    const existing = new Set(pairs.map((p) => p.find.toLowerCase()).filter(Boolean));
    const newPairs = candidates
      .filter(([name]) => !existing.has(name.toLowerCase()))
      .map(([name], i) => ({
        id: startId + i,
        find: name,
        replace: `Person ${String.fromCharCode(65 + i)}`,
      }));

    const filledPairs = pairs.filter((p) => p.find);
    setPairs([...filledPairs, ...newPairs]);
  };

  const reset = () => {
    setPairs([{ id: 1, find: "", replace: "" }]);
  };

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch (e) {}
  };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="min-h-screen bg-stone-50 px-5 py-4 sm:px-8 sm:py-6 lg:px-12">
      <div className="w-full">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">Transcript Name Replacer</h1>
          <p className="text-sm text-stone-600 mt-1">
            Paste your transcript, add names to swap out, copy the result.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-stone-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700">Original transcript</label>
              <span className="text-xs text-stone-500">
                {transcript.length.toLocaleString()} chars
              </span>
            </div>
            <div className="relative flex-1 min-h-[300px] border border-stone-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-stone-400">
              <div
                ref={inputMirrorRef}
                aria-hidden="true"
                className="absolute inset-0 p-3 text-sm font-mono whitespace-pre-wrap break-words overflow-auto pointer-events-none text-stone-900"
                dangerouslySetInnerHTML={{
                  __html:
                    inputHighlightHTML ||
                    '<span class="text-stone-400">Paste your transcript here...</span>',
                }}
              />
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onScroll={(e) => {
                  if (inputMirrorRef.current) {
                    inputMirrorRef.current.scrollTop = e.target.scrollTop;
                  }
                }}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-3 text-sm font-mono resize-none bg-transparent caret-stone-900 focus:outline-none placeholder:text-transparent"
                style={{ color: "transparent", WebkitTextFillColor: "transparent" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-stone-200 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-stone-700">Cleaned output</label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-500">
                  {replacementCount} replacement{replacementCount === 1 ? "" : "s"}
                </span>
                <button
                  onClick={copyOutput}
                  disabled={!output}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-stone-900 text-white hover:bg-stone-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-[300px] border border-stone-200 rounded-md bg-stone-50 overflow-auto">
              <div
                className="p-3 text-sm font-mono whitespace-pre-wrap break-words text-stone-900"
                dangerouslySetInnerHTML={{
                  __html:
                    outputHighlightHTML ||
                    '<span class="text-stone-400">Your cleaned transcript will appear somewhere here...</span>',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg border border-stone-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-sm font-medium text-stone-700">Name replacements</h2>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseInsensitive}
                  onChange={(e) => setCaseInsensitive(e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-900"
                />
                Case insensitive
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-3.5 h-3.5 accent-stone-900"
                />
                Whole word only
              </label>
              <button
                onClick={detectNames}
                disabled={!transcript}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-detect names
              </button>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-stone-100 text-stone-700 hover:bg-stone-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset pairs
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {pairs.map((pair) => (
              <div key={pair.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.find}
                  onChange={(e) => updatePair(pair.id, "find", e.target.value)}
                  placeholder="Find (e.g. John Smith)"
                  className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <span className="text-stone-400 text-sm">→</span>
                <input
                  type="text"
                  value={pair.replace}
                  onChange={(e) => updatePair(pair.id, "replace", e.target.value)}
                  placeholder="Replace with (e.g. Speaker 1)"
                  className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-400"
                />
                <button
                  onClick={() => removePair(pair.id)}
                  className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addPair}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-md transition"
          >
            <Plus className="w-4 h-4" /> Add another name
          </button>
        </div>

        <p className="text-xs text-stone-500 mt-4">
          Tip: "Whole word only" stops <span className="font-mono">Mark</span> from matching inside{" "}
          <span className="font-mono">market</span>. Turn it off if you want partial matches.
        </p>
      </div>
    </div>
  );
}
