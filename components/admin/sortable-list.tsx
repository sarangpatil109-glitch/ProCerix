"use client";

import { useState } from "react";
import { 
  DndContext, closestCenter, KeyboardSensor, PointerSensor, 
  useSensor, useSensors, DragEndEvent 
} from "@dnd-kit/core";
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

interface SortableItemProps {
  id: string;
  item: any;
  onChange: (key: string, value: string) => void;
  onRemove: () => void;
  schema: { key: string, label: string, type?: string }[];
}

function SortableItem({ id, item, onChange, onRemove, schema }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-[#1C1C1C] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm flex gap-4 group">
      <div {...attributes} {...listeners} className="cursor-grab pt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-3">
        {schema.map(field => (
          <div key={field.key}>
            <input 
              value={item[field.key] || ""} 
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.label}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#161616] border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 p-2 h-fit">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export function SortableJSONList({ 
  value, 
  onChange, 
  schema, 
  title 
}: { 
  value: any[], 
  onChange: (val: any[]) => void, 
  schema: { key: string, label: string }[],
  title: string
}) {
  // We need to ensure items have a stable id for dnd-kit. 
  // If no id exists, we create a temporary one internally.
  const [items, setItems] = useState<any[]>(() => {
    return (value || []).map(v => ({ ...v, _dndId: v._dndId || crypto.randomUUID() }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i._dndId === active.id);
        const newIndex = items.findIndex((i) => i._dndId === over.id);
        const newArr = arrayMove(items, oldIndex, newIndex);
        updateParent(newArr);
        return newArr;
      });
    }
  };

  const updateParent = (newArr: any[]) => {
    // strip _dndId before sending to parent
    onChange(newArr.map(item => {
      const { _dndId, ...rest } = item;
      return rest;
    }));
  };

  const handleItemChange = (id: string, key: string, val: string) => {
    const newItems = items.map(item => item._dndId === id ? { ...item, [key]: val } : item);
    setItems(newItems);
    updateParent(newItems);
  };

  const handleAddItem = () => {
    const newItem = { _dndId: crypto.randomUUID() };
    const newItems = [...items, newItem];
    setItems(newItems);
    updateParent(newItems);
  };

  const handleRemoveItem = (id: string) => {
    const newItems = items.filter(item => item._dndId !== id);
    setItems(newItems);
    updateParent(newItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
        <button 
          type="button" 
          onClick={handleAddItem}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Item
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i._dndId)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map(item => (
              <SortableItem 
                key={item._dndId} 
                id={item._dndId} 
                item={item} 
                schema={schema}
                onChange={(key, val) => handleItemChange(item._dndId, key, val)}
                onRemove={() => handleRemoveItem(item._dndId)}
              />
            ))}
            {items.length === 0 && (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-500">
                No items yet. Click "Add Item" to start.
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
