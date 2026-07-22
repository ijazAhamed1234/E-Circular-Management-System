import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, Heading1, Heading2,
} from "lucide-react";

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
