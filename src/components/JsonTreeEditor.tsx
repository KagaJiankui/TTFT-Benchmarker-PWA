import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, CaretRight, CaretDown } from '@phosphor-icons/react'
import { toast } from 'sonner'

type JsonValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'

interface JsonNode {
  id: string
  key: string
  value: any
  type: JsonValueType
  children?: JsonNode[]
  expanded?: boolean
}

interface JsonTreeEditorProps {
  providerId: string
  params: Record<string, any>
  onUpdate: (providerId: string, params: Record<string, any>) => void
}

function inferType(value: any): JsonValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  return 'string'
}

function convertToNodes(obj: Record<string, any>, parentId = ''): JsonNode[] {
  return Object.entries(obj).map(([key, value], index) => {
    const nodeId = `${parentId}-${index}-${key}`
    const type = inferType(value)
    
    const node: JsonNode = {
      id: nodeId,
      key,
      value: type === 'object' || type === 'array' ? null : value,
      type,
      expanded: true,
    }
    
    if (type === 'object' && value) {
      node.children = convertToNodes(value, nodeId)
    } else if (type === 'array' && Array.isArray(value)) {
      node.children = value.map((item, idx) => {
        const itemId = `${nodeId}-${idx}`
        const itemType = inferType(item)
        return {
          id: itemId,
          key: idx.toString(),
          value: itemType === 'object' || itemType === 'array' ? null : item,
          type: itemType,
          children: itemType === 'object' && item ? convertToNodes(item, itemId) : 
                    itemType === 'array' && Array.isArray(item) ? item.map((subItem, subIdx) => ({
                      id: `${itemId}-${subIdx}`,
                      key: subIdx.toString(),
                      value: subItem,
                      type: inferType(subItem),
                      expanded: true,
                    })) : undefined,
          expanded: true,
        }
      })
    }
    
    return node
  })
}

function convertToObject(nodes: JsonNode[]): Record<string, any> {
  const result: Record<string, any> = {}
  
  nodes.forEach(node => {
    if (!node.key.trim()) return
    
    if (node.type === 'object' && node.children) {
      result[node.key] = convertToObject(node.children)
    } else if (node.type === 'array' && node.children) {
      result[node.key] = node.children.map(child => {
        if (child.type === 'object' && child.children) {
          return convertToObject(child.children)
        } else if (child.type === 'array' && child.children) {
          return child.children.map(c => c.value)
        }
        return child.value
      })
    } else {
      result[node.key] = node.value
    }
  })
  
  return result
}

function JsonTreeNode({ 
  node, 
  depth = 0, 
  onUpdate, 
  onDelete, 
  onAddChild,
  isArrayItem = false,
}: { 
  node: JsonNode
  depth?: number
  onUpdate: (id: string, updates: Partial<JsonNode>) => void
  onDelete: (id: string) => void
  onAddChild: (id: string) => void
  isArrayItem?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(formatValue(node.value, node.type))

  function formatValue(val: any, type: JsonValueType): string {
    if (type === 'string') return val || ''
    if (type === 'number') return val?.toString() || '0'
    if (type === 'boolean') return val?.toString() || 'false'
    if (type === 'null') return 'null'
    return ''
  }

  function parseValue(str: string, type: JsonValueType): any {
    try {
      if (type === 'string') return str
      if (type === 'number') {
        const num = Number(str)
        if (isNaN(num)) {
          toast.error('Invalid number format')
          return 0
        }
        return num
      }
      if (type === 'boolean') return str === 'true'
      if (type === 'null') return null
      if (type === 'array') {
        const trimmed = str.trim()
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
          toast.error('Array must be wrapped in brackets []')
          return []
        }
        return JSON.parse(trimmed)
      }
      return str
    } catch (e) {
      toast.error('Invalid JSON syntax')
      return str
    }
  }

  const handleTypeChange = (newType: JsonValueType) => {
    let newValue: any
    let newChildren: JsonNode[] | undefined
    
    if (newType === 'object') {
      newValue = null
      newChildren = []
    } else if (newType === 'array') {
      newValue = null
      newChildren = []
    } else if (newType === 'string') {
      newValue = ''
    } else if (newType === 'number') {
      newValue = 0
    } else if (newType === 'boolean') {
      newValue = false
    } else if (newType === 'null') {
      newValue = null
    }
    
    onUpdate(node.id, { type: newType, value: newValue, children: newChildren })
    setEditValue(formatValue(newValue, newType))
  }

  const handleSave = () => {
    const newValue = parseValue(editValue, node.type)
    onUpdate(node.id, { value: newValue })
    setIsEditing(false)
  }

  const handleKeyChange = (newKey: string) => {
    onUpdate(node.id, { key: newKey })
  }

  const toggleExpanded = () => {
    onUpdate(node.id, { expanded: !node.expanded })
  }

  const hasChildren = (node.type === 'object' || node.type === 'array') && node.children

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-1 py-0.5 hover:bg-muted/30 group"
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={toggleExpanded}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent transition-colors"
          >
            {node.expanded ? (
              <CaretDown className="h-3 w-3" weight="fill" />
            ) : (
              <CaretRight className="h-3 w-3" weight="fill" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {!isArrayItem && (
          <Input
            value={node.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="text-xs h-6 w-20 font-mono border px-1"
            placeholder="key"
          />
        )}
        {isArrayItem && (
          <span className="text-xs font-mono text-muted-foreground w-8">[{node.key}]</span>
        )}

        <Select value={node.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-6 w-16 text-xs border px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-2 border-foreground">
            <SelectItem value="string">str</SelectItem>
            <SelectItem value="number">num</SelectItem>
            <SelectItem value="boolean">bool</SelectItem>
            <SelectItem value="array">[ ]</SelectItem>
            <SelectItem value="object">{ }</SelectItem>
            <SelectItem value="null">null</SelectItem>
          </SelectContent>
        </Select>

        {node.type !== 'object' && node.type !== 'array' && (
          isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSave()
                }
              }}
              className="text-xs h-6 flex-1 font-mono border px-1"
              autoFocus
              onFocus={(e) => e.target.select()}
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="text-xs h-6 flex-1 font-mono border px-1 flex items-center cursor-text hover:bg-muted/50 truncate"
            >
              {node.type === 'string' && <span className="text-green-600">"{node.value}"</span>}
              {node.type === 'number' && <span className="text-blue-600">{node.value}</span>}
              {node.type === 'boolean' && <span className="text-purple-600">{node.value?.toString()}</span>}
              {node.type === 'null' && <span className="text-muted-foreground">null</span>}
            </div>
          )
        )}

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {(node.type === 'object' || node.type === 'array') && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 border border-foreground/20 transition-all active:scale-95"
              onClick={() => onAddChild(node.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive border border-destructive/20 transition-all active:scale-95"
            onClick={() => onDelete(node.id)}
          >
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {hasChildren && node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <JsonTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              isArrayItem={node.type === 'array'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function JsonTreeEditor({ providerId, params, onUpdate }: JsonTreeEditorProps) {
  const [nodes, setNodes] = useState<JsonNode[]>(() => convertToNodes(params || {}))
  const [syntaxError, setSyntaxError] = useState<string | null>(null)

  useEffect(() => {
    setNodes(convertToNodes(params || {}))
  }, [providerId])

  const updateNodes = (newNodes: JsonNode[]) => {
    setNodes(newNodes)
    try {
      const obj = convertToObject(newNodes)
      setSyntaxError(null)
      onUpdate(providerId, obj)
    } catch (e) {
      setSyntaxError(e instanceof Error ? e.message : 'Invalid JSON structure')
    }
  }

  const handleNodeUpdate = (id: string, updates: Partial<JsonNode>) => {
    const updateNode = (nodes: JsonNode[]): JsonNode[] => {
      return nodes.map(node => {
        if (node.id === id) {
          return { ...node, ...updates }
        }
        if (node.children) {
          return { ...node, children: updateNode(node.children) }
        }
        return node
      })
    }
    updateNodes(updateNode(nodes))
  }

  const handleNodeDelete = (id: string) => {
    const deleteNode = (nodes: JsonNode[]): JsonNode[] => {
      return nodes.filter(node => {
        if (node.id === id) return false
        if (node.children) {
          node.children = deleteNode(node.children)
        }
        return true
      })
    }
    updateNodes(deleteNode(nodes))
  }

  const handleAddChild = (parentId: string) => {
    const addChild = (nodes: JsonNode[]): JsonNode[] => {
      return nodes.map(node => {
        if (node.id === parentId) {
          const newChild: JsonNode = {
            id: `${parentId}-${Date.now()}`,
            key: node.type === 'array' ? (node.children?.length || 0).toString() : '',
            value: '',
            type: 'string',
            expanded: true,
          }
          return {
            ...node,
            children: [...(node.children || []), newChild],
          }
        }
        if (node.children) {
          return { ...node, children: addChild(node.children) }
        }
        return node
      })
    }
    updateNodes(addChild(nodes))
  }

  const handleAddRoot = () => {
    const newNode: JsonNode = {
      id: `root-${Date.now()}`,
      key: '',
      value: '',
      type: 'string',
      expanded: true,
    }
    updateNodes([...nodes, newNode])
  }

  const handleClearAll = () => {
    updateNodes([])
  }

  return (
    <Card className="p-3 mt-3 border-2 border-foreground/30">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground flex-shrink-0">Request Params</h4>
        <div className="flex gap-1 flex-shrink-0">
          {nodes.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs border border-foreground/20 transition-all active:scale-95"
              onClick={handleClearAll}
            >
              Clear
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 border border-foreground/20 transition-all active:scale-95"
            onClick={handleAddRoot}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {syntaxError && (
        <div className="mb-2 p-2 border-2 border-destructive bg-destructive/10 text-xs text-destructive">
          {syntaxError}
        </div>
      )}
      
      <div className="max-h-64 overflow-y-auto border-2 border-foreground/20 bg-card">
        {nodes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No params. Click + to add.
          </p>
        ) : (
          <div className="p-1">
            {nodes.map((node) => (
              <JsonTreeNode
                key={node.id}
                node={node}
                onUpdate={handleNodeUpdate}
                onDelete={handleNodeDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>
      
      <p className="text-[10px] text-muted-foreground mt-2">
        Tree view: Add child (+), delete node, change type. Arrays must use [brackets].
      </p>
    </Card>
  )
}
