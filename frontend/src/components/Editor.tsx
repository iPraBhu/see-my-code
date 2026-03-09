import { useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface Props {
  doc: Y.Doc | null
  provider: WebsocketProvider | null
  language: string
  theme: string
}

export default function Editor({ doc, provider, language, theme }: Props) {
  const bindingRef = useRef<any>(null)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)

  const setupBinding = (editor: any, ydoc: Y.Doc, wsProvider: WebsocketProvider) => {
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    import('y-monaco').then(({ MonacoBinding }) => {
      const yText = ydoc.getText('content')
      const model = editor.getModel()
      if (!model) return

      // @ts-ignore
      bindingRef.current = new MonacoBinding(
        yText,
        model,
        new Set([editor]),
        wsProvider.awareness,
      )
    })
  }

  const handleMount = (editor: any, _monaco: any) => {
    editorRef.current = editor
    monacoRef.current = _monaco

    if (doc && provider) {
      setupBinding(editor, doc, provider)
    }
  }

  useEffect(() => {
    if (editorRef.current && doc && provider) {
      setupBinding(editorRef.current, doc, provider)
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
    }
  }, [doc, provider])

  return (
    <div className="editor-container">
      <MonacoEditor
        height="100%"
        language={language}
        theme={theme}
        onMount={handleMount}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          smoothScrolling: true,
        }}
      />
    </div>
  )
}
