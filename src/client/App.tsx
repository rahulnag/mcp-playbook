// src/client/App.tsx
// Full MCP Playbook UI — wired to real dev server API
// Designed for backend/fullstack developers building MCP tools

import { useState, useCallback, useEffect } from 'react'
import { useServers, type DiscoveredTool, type DiscoveredServer } from './hooks/useServers'
import { useHotReload } from './hooks/useHotReload'
import { useExecute } from './hooks/useExecute'

// ─── Design tokens ─────────────────────────────────────────────────
const C = {
  bg:        '#080808',
  surface:   '#111111',
  elevated:  '#181818',
  border:    '#1e1e1e',
  borderMid: '#282828',
  text:      '#e2e0d8',
  muted:     '#5a5856',
  dim:       '#343230',
  accent:    '#7c74d8',
  accentLo:  '#1a192e',
  accentHi:  '#a39cf0',
  green:     '#4db882',
  greenLo:   '#0d1f16',
  red:       '#c0574a',
  redLo:     '#1e0e0c',
  amber:     '#c49a3c',
  amberLo:   '#1e1608',
}

// ─── Tiny primitives ───────────────────────────────────────────────

function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: string }) {
  const map: Record<string, { bg: string; fg: string; border: string }> = {
    default:  { bg: C.elevated,  fg: C.muted,   border: C.border   },
    accent:   { bg: C.accentLo,  fg: C.accentHi, border: '#2e2c4e' },
    green:    { bg: C.greenLo,   fg: C.green,   border: '#1a3326'  },
    red:      { bg: C.redLo,     fg: C.red,     border: '#3a1a17'  },
    amber:    { bg: C.amberLo,   fg: C.amber,   border: '#3a2a10'  },
  }
  const s = map[color] || map.default
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.02em',
      background: s.bg,
      color: s.fg,
      border: `1px solid ${s.border}`,
    }}>{children}</span>
  )
}

function Dot({ status }: { status: string }) {
  const color = status === 'connected' ? C.green : status === 'error' ? C.red : C.dim
  return (
    <span style={{
      display: 'inline-block',
      width: '6px', height: '6px',
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }} />
  )
}

// ─── Parameter input ───────────────────────────────────────────────

// Objects and arrays are edited as JSON text. Only valid JSON is sent to the
// tool; while the text is invalid the field is cleared and outlined red.
function JsonInput({ name, value, onChange, style }: {
  name:     string
  value:    unknown
  onChange: (name: string, value: unknown) => void
  style:    React.CSSProperties
}) {
  const format = (v: unknown) => (v === undefined ? '' : JSON.stringify(v, null, 2))
  const [raw, setRaw]     = useState(format(value))
  const [valid, setValid] = useState(true)

  // Sync when the value changes from outside (e.g. loading an example)
  useEffect(() => {
    try {
      if (JSON.stringify(JSON.parse(raw)) === JSON.stringify(value)) return
    } catch {}
    if (value !== undefined) { setRaw(format(value)); setValid(true) }
  }, [value])

  function handle(text: string) {
    setRaw(text)
    if (!text.trim()) { setValid(true); return onChange(name, undefined) }
    try { onChange(name, JSON.parse(text)); setValid(true) }
    catch { onChange(name, undefined); setValid(false) }
  }

  return (
    <textarea
      value={raw}
      rows={4}
      placeholder='JSON, e.g. {"key": "value"} or ["a", "b"]'
      onChange={e => handle(e.target.value)}
      style={{ ...style, resize: 'vertical', ...(valid ? {} : { border: `1px solid ${C.red}` }) }}
    />
  )
}

function ParamInput({ name, schema, required, value, onChange }: {
  name:     string
  schema:   any
  required: boolean
  value:    unknown
  onChange: (name: string, value: unknown) => void
}) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.borderMid}`,
    borderRadius: '5px',
    padding: '7px 10px',
    color: C.text,
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }

  if (schema.enum) {
    return (
      <select
        value={String(value ?? '')}
        onChange={e => onChange(name, e.target.value)}
        style={{ ...inputStyle, cursor: 'pointer' }}
      >
        <option value="">— select —</option>
        {schema.enum.map((v: string) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    )
  }

  if (schema.type === 'boolean') {
    return (
      <div style={{ display: 'flex', gap: '6px' }}>
        {['true', 'false'].map(v => (
          <button
            key={v}
            onClick={() => onChange(name, v === 'true')}
            style={{
              padding: '6px 14px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit',
              border: `1px solid ${String(value) === v ? C.accent : C.border}`,
              background: String(value) === v ? C.accentLo : C.surface,
              color: String(value) === v ? C.accentHi : C.muted,
              transition: 'all 0.12s',
            }}
          >{v}</button>
        ))}
      </div>
    )
  }

  if (schema.type === 'object' || schema.type === 'array') {
    return <JsonInput name={name} value={value} onChange={onChange} style={inputStyle} />
  }

  if (schema.type === 'number' || schema.type === 'integer') {
    return (
      <input
        type="number"
        value={value !== undefined ? String(value) : ''}
        placeholder={schema.default !== undefined ? String(schema.default) : ''}
        onChange={e => onChange(name, e.target.value ? Number(e.target.value) : undefined)}
        style={inputStyle}
      />
    )
  }

  return (
    <input
      type="text"
      value={String(value ?? '')}
      placeholder={schema.description || name}
      onChange={e => onChange(name, e.target.value)}
      style={inputStyle}
    />
  )
}

// ─── Tool detail ───────────────────────────────────────────────────

function ToolDetail({ tool, server, isStatic }: { tool: DiscoveredTool; server: DiscoveredServer; isStatic: boolean }) {
  const [tab, setTab]       = useState<'docs' | 'try' | 'examples' | 'schema'>('docs')
  const [inputs, setInputs] = useState<Record<string, unknown>>({})
  const [exampleLabel, setExampleLabel] = useState<string | null>(null)
  const { execute, running, result, clear } = useExecute()

  const params   = tool.inputSchema?.properties || {}
  const required = tool.inputSchema?.required   || []

  function handleInput(name: string, value: unknown) {
    setInputs(prev => ({ ...prev, [name]: value }))
  }

  function loadExample(ex: { label: string; input: Record<string, unknown> }) {
    setInputs(ex.input)
    setExampleLabel(ex.label)
    setTab('try')
    clear()
  }

  function handleRun() {
    execute(server.id, tool.name, inputs)
  }

  // Static builds have no backend to run tools against
  const canRun = !isStatic && server.status === 'connected'

  const tabs = [
    { key: 'docs',     label: 'Docs'    },
    { key: 'try',      label: 'Try it'  },
    { key: 'examples', label: `Examples${tool.examples.length > 0 ? ` (${tool.examples.length})` : ''}` },
    { key: 'schema',   label: 'Schema'  },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '22px 28px 0',
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: C.accentHi, margin: 0, fontFamily: 'inherit' }}>
            {tool.name}
          </h2>
          {tool.tags.map(t => (
            <Badge key={t} color="accent">{t}</Badge>
          ))}
          <Badge color={server.status === 'connected' ? 'green' : 'red'}>
            {server.name}
          </Badge>
        </div>

        <p style={{
          fontSize: '13px', color: C.muted,
          lineHeight: '1.6', margin: '0 0 16px',
          maxWidth: '640px',
        }}>
          {tool.description}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t.key ? C.accent : 'transparent'}`,
                color: tab === t.key ? C.accentHi : C.muted,
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: 'inherit',
                fontWeight: tab === t.key ? 600 : 400,
                transition: 'all 0.12s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

        {/* ── DOCS ── */}
        {tab === 'docs' && (
          <div>
            <Section title="Parameters">
              {Object.keys(params).length === 0 ? (
                <p style={{ color: C.muted, fontSize: '13px' }}>No parameters</p>
              ) : (
                Object.entries(params).map(([name, schema]: [string, any]) => (
                  <div key={name} style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '16px',
                    padding: '12px 0',
                    borderBottom: `1px solid ${C.border}`,
                    alignItems: 'start',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'inherit', fontSize: '13px', color: C.text, fontWeight: 500 }}>
                          {name}
                        </span>
                        {required.includes(name) && (
                          <span style={{ fontSize: '10px', color: C.red }}>required</span>
                        )}
                      </div>
                      <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <Badge color={schema.enum ? 'amber' : 'default'}>
                          {schema.enum ? 'enum' : schema.type}
                        </Badge>
                      </div>
                      {schema.default !== undefined && (
                        <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>
                          default: <span style={{ color: C.accent }}>{String(schema.default)}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: C.muted, lineHeight: '1.55' }}>
                        {schema.description}
                      </p>
                      {schema.enum && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
                          {schema.enum.map((v: string) => (
                            <code key={v} style={{
                              fontSize: '11px',
                              background: C.elevated,
                              color: C.amber,
                              padding: '1px 7px',
                              borderRadius: '3px',
                              border: `1px solid ${C.border}`,
                            }}>{v}</code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Section>

            {tool.inputSchema && (
              <Section title="Returns">
                <p style={{ fontSize: '13px', color: C.muted, lineHeight: '1.55', margin: 0 }}>
                  See Schema tab for full input schema. Output format depends on your server implementation.
                </p>
              </Section>
            )}
          </div>
        )}

        {/* ── TRY IT ── */}
        {tab === 'try' && (
          <div>
            {exampleLabel && (
              <div style={{
                padding: '8px 12px',
                background: C.accentLo,
                border: `1px solid #2e2c4e`,
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '12px',
                color: C.accentHi,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>Using example: <strong>{exampleLabel}</strong></span>
                <button
                  onClick={() => { setInputs({}); setExampleLabel(null); clear() }}
                  style={{
                    background: 'none', border: 'none',
                    color: C.muted, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
                  }}
                >clear ✕</button>
              </div>
            )}

            {Object.keys(params).length === 0 ? (
              <p style={{ color: C.muted, fontSize: '13px', marginBottom: '20px' }}>
                This tool takes no parameters.
              </p>
            ) : (
              Object.entries(params).map(([name, schema]: [string, any]) => (
                <div key={name} style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr',
                  gap: '16px',
                  padding: '12px 0',
                  borderBottom: `1px solid ${C.border}`,
                  alignItems: 'start',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: C.text, fontWeight: 500 }}>{name}</span>
                      {required.includes(name) && (
                        <span style={{ fontSize: '10px', color: C.red }}>required</span>
                      )}
                    </div>
                    <Badge color={schema.enum ? 'amber' : 'default'}>
                      {schema.enum ? 'enum' : schema.type}
                    </Badge>
                  </div>
                  <div>
                    <ParamInput
                      name={name}
                      schema={schema}
                      required={required.includes(name)}
                      value={inputs[name]}
                      onChange={handleInput}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: '11px', color: C.muted }}>
                      {schema.description}
                    </p>
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={handleRun}
                disabled={running || !canRun}
                style={{
                  padding: '9px 22px',
                  borderRadius: '6px',
                  cursor: !canRun ? 'not-allowed' : 'pointer',
                  border: 'none',
                  background: running ? C.accentLo : C.accent,
                  color: 'white',
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                  opacity: !canRun ? 0.4 : 1,
                  transition: 'all 0.12s',
                }}
              >
                {running ? '◌  Running...' : '▶  Run tool'}
              </button>
              {isStatic ? (
                <span style={{ fontSize: '12px', color: C.muted }}>
                  Static docs — run <code>mcp-playbook dev</code> to execute tools
                </span>
              ) : server.status !== 'connected' && (
                <span style={{ fontSize: '12px', color: C.red }}>
                  Server {server.status}
                </span>
              )}
              {result && !running && (
                <span style={{ fontSize: '12px', color: C.green }}>
                  ✓ {result.duration_ms}ms
                </span>
              )}
            </div>

            {result && (
              <div style={{ marginTop: '20px' }}>
                {result.error ? (
                  <div style={{
                    padding: '14px',
                    background: C.redLo,
                    border: `1px solid #3a1a17`,
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: C.red,
                    fontFamily: 'inherit',
                  }}>
                    Error: {result.error}
                  </div>
                ) : (
                  <pre style={{
                    margin: 0,
                    padding: '16px',
                    background: C.surface,
                    border: `1px solid ${C.borderMid}`,
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: C.green,
                    lineHeight: '1.65',
                    overflowX: 'auto',
                    fontFamily: 'inherit',
                  }}>
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── EXAMPLES ── */}
        {tab === 'examples' && (
          <div>
            {tool.examples.length === 0 ? (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: C.muted,
                fontSize: '13px',
                border: `1px dashed ${C.border}`,
                borderRadius: '8px',
              }}>
                <p style={{ marginBottom: '8px' }}>No examples defined for this tool.</p>
                <p style={{ fontSize: '12px' }}>
                  Add them in <code style={{ color: C.accent }}>playbook.config.ts</code> under <code style={{ color: C.accent }}>examples.{tool.name}</code>
                </p>
              </div>
            ) : (
              tool.examples.map((ex, i) => (
                <div key={i} style={{
                  marginBottom: '14px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px',
                    background: C.elevated,
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: '13px', color: C.text, fontWeight: 500 }}>
                        {ex.label}
                      </span>
                      {ex.description && (
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.muted }}>
                          {ex.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => loadExample(ex)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        border: `1px solid ${C.accent}`,
                        background: C.accentLo,
                        color: C.accentHi,
                        fontSize: '12px',
                        fontFamily: 'inherit',
                        transition: 'all 0.12s',
                      }}
                    >Load →</button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '14px',
                    fontSize: '12px',
                    color: C.muted,
                    lineHeight: '1.65',
                    fontFamily: 'inherit',
                    overflowX: 'auto',
                  }}>
                    {JSON.stringify(ex.input, null, 2)}
                  </pre>
                  {ex.expectedOutput !== undefined && (
                    <>
                      <div style={{
                        padding: '6px 14px',
                        background: C.greenLo,
                        borderTop: `1px solid ${C.border}`,
                        fontSize: '11px',
                        color: C.green,
                      }}>
                        Expected output
                      </div>
                      <pre style={{
                        margin: 0,
                        padding: '14px',
                        fontSize: '12px',
                        color: C.green,
                        lineHeight: '1.65',
                        fontFamily: 'inherit',
                        overflowX: 'auto',
                      }}>
                        {JSON.stringify(ex.expectedOutput, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SCHEMA ── */}
        {tab === 'schema' && (
          <div>
            <Section title="Input schema (JSON Schema)">
              <pre style={{
                margin: 0,
                padding: '16px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                fontSize: '12px',
                color: C.muted,
                lineHeight: '1.65',
                overflowX: 'auto',
                fontFamily: 'inherit',
              }}>
                {JSON.stringify(tool.inputSchema, null, 2)}
              </pre>
            </Section>

            <Section title="MCP tool definition (copy-paste ready)">
              <pre style={{
                margin: 0,
                padding: '16px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: '6px',
                fontSize: '12px',
                color: C.accentHi,
                lineHeight: '1.65',
                overflowX: 'auto',
                fontFamily: 'inherit',
              }}>
                {JSON.stringify({
                  name:        tool.name,
                  description: tool.description,
                  inputSchema: tool.inputSchema,
                }, null, 2)}
              </pre>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <h3 style={{
        margin: '0 0 14px',
        fontSize: '11px',
        color: C.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
        fontFamily: 'inherit',
      }}>{title}</h3>
      {children}
    </div>
  )
}

// ─── Sidebar tool card ─────────────────────────────────────────────

function ToolCard({ tool, server, selected, onClick }: {
  tool:     DiscoveredTool
  server:   DiscoveredServer
  selected: boolean
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: '6px',
        border: `1px solid ${selected ? C.accent : 'transparent'}`,
        background: selected ? C.accentLo : 'transparent',
        cursor: 'pointer',
        marginBottom: '3px',
        transition: 'all 0.12s',
        fontFamily: 'inherit',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: selected ? 600 : 400,
        color: selected ? C.accentHi : C.text,
        marginBottom: '3px',
      }}>
        {tool.name}
      </div>
      <div style={{
        fontSize: '11px',
        color: C.muted,
        lineHeight: '1.4',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as any,
      }}>
        {tool.description}
      </div>
    </button>
  )
}

// ─── Main App ──────────────────────────────────────────────────────

export default function App() {
  const { data, loading, error, refresh, reload } = useServers()
  useHotReload(reload, !!data && !data.static)

  const [search, setSearch]           = useState('')
  const [filterServer, setFilterServer] = useState('all')
  const [selected, setSelected]       = useState<{ tool: DiscoveredTool; server: DiscoveredServer } | null>(null)

  const allServers = data?.servers || []

  // Flat list of {tool, server} pairs
  const allTools = allServers.flatMap(s =>
    s.tools.map(t => ({ tool: t, server: s }))
  )

  const filtered = allTools.filter(({ tool, server }) => {
    const matchServer = filterServer === 'all' || server.id === filterServer
    const q = search.toLowerCase()
    const matchSearch = !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags.some(t => t.toLowerCase().includes(q))
    return matchServer && matchSearch
  })

  const connectedCount = allServers.filter(s => s.status === 'connected').length

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: C.bg,
      color: C.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      overflow: 'hidden',
    }}>

      {/* ── Top bar ── */}
      <header style={{
        height: '46px',
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        padding: '0 18px',
        gap: '14px',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: C.text }}>
          ⚡ {data?.title || 'MCP Playbook'}
        </span>
        <div style={{ width: '1px', height: '18px', background: C.border }} />
        {loading ? (
          <span style={{ fontSize: '12px', color: C.muted }}>Connecting...</span>
        ) : error ? (
          <span style={{ fontSize: '12px', color: C.red }}>Connection error</span>
        ) : (
          <span style={{ fontSize: '12px', color: C.muted }}>
            {connectedCount}/{allServers.length} servers · {allTools.length} tools
          </span>
        )}
        <div style={{ flex: 1 }} />

        {/* Server status pills */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {allServers.map(s => (
            <div key={s.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: C.elevated,
              border: `1px solid ${C.border}`,
              fontSize: '11px',
            }}>
              <Dot status={s.status} />
              <span style={{ color: s.status === 'connected' ? C.muted : C.dim }}>
                {s.name}
              </span>
              <span style={{ color: C.dim }}>v{s.version}</span>
            </div>
          ))}
        </div>

        <button
          onClick={refresh}
          title="Refresh servers"
          style={{
            background: 'none',
            border: `1px solid ${C.border}`,
            borderRadius: '5px',
            padding: '4px 10px',
            color: C.muted,
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
          }}
        >↻ Refresh</button>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: '268px',
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          background: C.surface,
          flexShrink: 0,
          overflow: 'hidden',
        }}>

          {/* Search */}
          <div style={{ padding: '12px 12px 8px' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tools..."
              style={{
                width: '100%',
                background: C.elevated,
                border: `1px solid ${C.border}`,
                borderRadius: '5px',
                padding: '7px 10px',
                color: C.text,
                fontSize: '12px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Server filter */}
          <div style={{
            padding: '0 12px 10px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
          }}>
            {['all', ...allServers.map(s => s.id)].map(id => {
              const label = id === 'all' ? 'All' : allServers.find(s => s.id === id)?.name || id
              const active = filterServer === id
              return (
                <button
                  key={id}
                  onClick={() => setFilterServer(id)}
                  style={{
                    padding: '2px 9px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                    border: `1px solid ${active ? C.accent : C.border}`,
                    background: active ? C.accentLo : 'transparent',
                    color: active ? C.accentHi : C.muted,
                    transition: 'all 0.12s',
                  }}
                >{label}</button>
              )
            })}
          </div>

          <div style={{ height: '1px', background: C.border, flexShrink: 0 }} />

          {/* Tool list — grouped by server */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
            {loading && (
              <p style={{ color: C.muted, fontSize: '12px', padding: '12px 2px' }}>
                Connecting to servers...
              </p>
            )}

            {error && (
              <div style={{
                padding: '10px',
                background: C.redLo,
                border: `1px solid #3a1a17`,
                borderRadius: '6px',
                fontSize: '12px',
                color: C.red,
                margin: '4px 0',
              }}>
                {error}
                <br />
                <span style={{ color: C.muted, fontSize: '11px' }}>
                  Is mcp-playbook dev server running?
                </span>
              </div>
            )}

            {!loading && !error && filtered.length === 0 && (
              <p style={{ color: C.muted, fontSize: '12px', padding: '12px 2px' }}>
                No tools match
              </p>
            )}

            {/* Group by server */}
            {filterServer === 'all'
              ? allServers.map(server => {
                  const serverTools = filtered.filter(f => f.server.id === server.id)
                  if (serverTools.length === 0) return null
                  return (
                    <div key={server.id} style={{ marginBottom: '8px' }}>
                      <div style={{
                        padding: '4px 2px 6px',
                        fontSize: '10px',
                        color: C.dim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Dot status={server.status} />
                        {server.name}
                        <span style={{ color: C.dim }}>({serverTools.length})</span>
                      </div>
                      {serverTools.map(({ tool }) => (
                        <ToolCard
                          key={tool.name}
                          tool={tool}
                          server={server}
                          selected={selected?.tool.name === tool.name && selected?.server.id === server.id}
                          onClick={() => setSelected({ tool, server })}
                        />
                      ))}
                    </div>
                  )
                })
              : filtered.map(({ tool, server }) => (
                  <ToolCard
                    key={`${server.id}-${tool.name}`}
                    tool={tool}
                    server={server}
                    selected={selected?.tool.name === tool.name && selected?.server.id === server.id}
                    onClick={() => setSelected({ tool, server })}
                  />
                ))
            }
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main style={{ flex: 1, overflow: 'hidden', background: C.bg }}>
          {selected ? (
            <ToolDetail tool={selected.tool} server={selected.server} isStatic={!!data?.static} />
          ) : (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.dim,
            }}>
              <div style={{ fontSize: '36px', marginBottom: '14px', opacity: 0.4 }}>⚡</div>
              <p style={{ fontSize: '14px', marginBottom: '6px', color: C.muted }}>
                Select a tool
              </p>
              {allTools.length > 0 && (
                <p style={{ fontSize: '12px', color: C.dim }}>
                  {allTools.length} tools across {allServers.length} servers
                </p>
              )}
              {data?.description && (
                <p style={{ fontSize: '12px', color: C.dim, marginTop: '8px', maxWidth: '300px', textAlign: 'center' }}>
                  {data.description}
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
