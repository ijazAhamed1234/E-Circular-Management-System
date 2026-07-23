import { useEditor, EditorContent } from "@tiptap/react";
import React, { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Image from "@tiptap/extension-image";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Heading1, Heading2, Table as TableIcon,
  Trash2, PlusSquare, SplitSquareHorizontal, SplitSquareVertical,
  Highlighter, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, ImageIcon, Palette, Type,
  Rows3, Columns3
} from "lucide-react";
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolBtn({
  active, onClick, title, children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`w-7 h-7 flex items-center justify-center rounded transition-all text-[13px]
        ${active
          ? "bg-[#1a3567] text-white shadow-sm"
          : "text-[#4a5580] hover:bg-[#eef1fa] hover:text-[#1a3567]"
        }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, placeholder = "Write circular content here…" }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Image.configure({ inline: true, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none min-h-[220px] text-sm text-[#1a2240] leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && content && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  const sep = <div className="w-px h-5 bg-[#dde2f0] mx-0.5" />;

  return (
    <div className="border border-[#d0d8ee] rounded-xl overflow-hidden bg-white focus-within:border-[#1a3567] focus-within:ring-2 focus-within:ring-[#1a3567]/10 transition-all">
      <style>{`
        .prose-editor p { margin: 0 0 0.6em; }
        .prose-editor h1 { font-size: 1.25em; font-weight: 700; color: #1a3567; margin: 0.5em 0; }
        .prose-editor h2 { font-size: 1.1em; font-weight: 700; color: #1a3567; margin: 0.5em 0; }
        .prose-editor h3 { font-size: 1em; font-weight: 700; margin: 0.5em 0; }
        .prose-editor ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .prose-editor ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .prose-editor li { margin: 0.2em 0; }
        .prose-editor strong { font-weight: 700; }
        .prose-editor em { font-style: italic; }
        .prose-editor u { text-decoration: underline; }
        .prose-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #a0aabb;
          pointer-events: none;
          float: left;
          height: 0;
        }
        .prose-editor table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 1em 0; overflow: hidden; }
        .prose-editor td, .prose-editor th { min-width: 1em; border: 1px solid #ced4da; padding: 6px 12px; vertical-align: top; box-sizing: border-box; position: relative; }
        .prose-editor th { font-weight: bold; text-align: left; background-color: #f1f3f5; }
        .prose-editor .column-resize-handle { position: absolute; right: -2px; top: 0; bottom: -2px; width: 4px; background-color: #adf; pointer-events: none; }
        .prose-editor.resize-cursor { cursor: ew-resize; cursor: col-resize; }
        .ProseMirror:focus { outline: none; }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 border-b border-[#eaecf5] bg-[#f8faff]">
        <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={13} />
        </ToolBtn>
        <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={13} />
        </ToolBtn>
        {sep}
        <ToolBtn title="Bold" active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn title="Underline" active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon size={13} />
        </ToolBtn>
        {sep}
        <ToolBtn title="Bullet List" active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={13} />
        </ToolBtn>
        <ToolBtn title="Numbered List" active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={13} />
        </ToolBtn>
        {sep}
        <ToolBtn title="Align Left" active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft size={13} />
        </ToolBtn>
        <ToolBtn title="Align Center" active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter size={13} />
        </ToolBtn>
        <ToolBtn title="Align Right" active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight size={13} />
        </ToolBtn>
        <ToolBtn title="Subscript" active={editor.isActive("subscript")}
          onClick={() => editor.chain().focus().toggleSubscript().run()}>
          <SubscriptIcon size={13} />
        </ToolBtn>
        <ToolBtn title="Superscript" active={editor.isActive("superscript")}
          onClick={() => editor.chain().focus().toggleSuperscript().run()}>
          <SuperscriptIcon size={13} />
        </ToolBtn>
        {sep}
        <div className="flex items-center relative gap-1">
          <Palette size={13} className="text-[#4a5580] ml-1" />
          <input
            type="color"
            title="Text Color"
            className="w-5 h-5 p-0 border-0 cursor-pointer"
            onInput={(e) => editor.chain().focus().setColor(e.currentTarget.value).run()}
            value={editor.getAttributes("textStyle").color || "#000000"}
          />
        </div>
        <div className="flex items-center relative gap-1">
          <Highlighter size={13} className="text-[#4a5580] ml-1" />
          <input
            type="color"
            title="Highlight Color"
            className="w-5 h-5 p-0 border-0 cursor-pointer"
            onInput={(e) => editor.chain().focus().toggleHighlight({ color: e.currentTarget.value }).run()}
            value={editor.getAttributes("highlight").color || "#ffff00"}
          />
        </div>
        <div className="flex items-center relative mx-1">
          <select
            title="Font Family"
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            className="text-[11px] bg-transparent outline-none cursor-pointer border rounded px-1 py-0.5 text-[#4a5580]"
            value={editor.getAttributes('textStyle').fontFamily || ''}
          >
            <option value="">Default Font</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New</option>
            <option value="Courier New">Courier</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>
        {sep}
        <ToolBtn title="Insert Image" onClick={() => {
          const url = window.prompt("Enter image URL");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}>
          <ImageIcon size={13} />
        </ToolBtn>
        <ToolBtn title="Insert Table" 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <TableIcon size={13} />
        </ToolBtn>
        {editor.isActive('table') && (
          <>
            {sep}
            {/* Row operations */}
            <ToolBtn title="Add Row Before" onClick={() => editor.chain().focus().addRowBefore().run()}>
              <span className="flex flex-col items-center gap-0" title="Add Row Before">
                <Rows3 size={10}/>
                <span className="text-[7px] leading-none">+↑</span>
              </span>
            </ToolBtn>
            <ToolBtn title="Add Row After" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <span className="flex flex-col items-center gap-0">
                <Rows3 size={10}/>
                <span className="text-[7px] leading-none">+↓</span>
              </span>
            </ToolBtn>
            <ToolBtn title="Delete Row" onClick={() => editor.chain().focus().deleteRow().run()}>
              <span className="flex flex-col items-center gap-0">
                <Rows3 size={10}/>
                <span className="text-[7px] leading-none text-red-400">✕</span>
              </span>
            </ToolBtn>
            {sep}
            {/* Column operations */}
            <ToolBtn title="Add Column Before" onClick={() => editor.chain().focus().addColumnBefore().run()}>
              <span className="flex flex-col items-center gap-0">
                <Columns3 size={10}/>
                <span className="text-[7px] leading-none">+←</span>
              </span>
            </ToolBtn>
            <ToolBtn title="Add Column After" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <span className="flex flex-col items-center gap-0">
                <Columns3 size={10}/>
                <span className="text-[7px] leading-none">+→</span>
              </span>
            </ToolBtn>
            <ToolBtn title="Delete Column" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <span className="flex flex-col items-center gap-0">
                <Columns3 size={10}/>
                <span className="text-[7px] leading-none text-red-400">✕</span>
              </span>
            </ToolBtn>
            {sep}
            <ToolBtn title="Delete Table" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 size={13} className="text-red-400" />
            </ToolBtn>
          </>
        )}
        {sep}
        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 size={13} />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 size={13} />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <div className="px-4 py-3 min-h-[220px]" data-placeholder={placeholder}>
        <EditorContent editor={editor} />
      </div>

      {/* Word count */}
      <div className="px-4 py-1.5 border-t border-[#eaecf5] bg-[#f8faff] text-[10px] text-[#a0aabb] text-right">
        {editor.getText().trim().split(/\s+/).filter(Boolean).length} words
      </div>
    </div>
  );
}
