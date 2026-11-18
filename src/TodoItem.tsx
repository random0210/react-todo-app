import React, { useState } from 'react';
import type { Todo } from './types';
import dayjs from 'dayjs';

type Props = {
  todo: Todo;
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
  updateTodo: (
    id: string,
    name: string,
    priority: number,
    deadline: Date | null
  ) => void;
};

const TodoItem: React.FC<Props> = ({
  todo,
  updateIsDone,
  remove,
  updateTodo,
}) => {
  // 編集モード用の状態
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const [editPriority, setEditPriority] = useState(todo.priority);
  const [editDeadline, setEditDeadline] = useState<string>(
    todo.deadline ? dayjs(todo.deadline).format('YYYY-MM-DDTHH:mm') : ''
  );
  const [editError, setEditError] = useState('');

  // 編集開始
  const handleStartEdit = () => {
    setEditName(todo.name);
    setEditPriority(todo.priority);
    setEditDeadline(
      todo.deadline ? dayjs(todo.deadline).format('YYYY-MM-DDTHH:mm') : ''
    );
    setEditError('');
    setIsEditing(true);
  };

  // 編集保存
  const handleSaveEdit = () => {
    const trimmed = editName.trim();
    if (trimmed.length < 2 || trimmed.length > 32) {
      setEditError('2文字以上、32文字以内で入力してください');
      return;
    }
    updateTodo(
      todo.id,
      trimmed,
      editPriority,
      editDeadline === '' ? null : new Date(editDeadline)
    );
    setIsEditing(false);
  };

  // 締め切り状態の判定（'normal' | 'urgent' | 'overdue'）
  const getDeadlineStatus = (): 'normal' | 'urgent' | 'overdue' => {
    if (!todo.deadline || todo.isDone) {
      return 'normal';
    }

    const now = new Date().getTime();
    const deadlineTime = new Date(todo.deadline).getTime();
    const diffMs = deadlineTime - now;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;

    if (diffMs < 0) {
      return 'overdue';
    }
    if (diffMs <= oneWeekMs) {
      return 'urgent';
    }
    return 'normal';
  };

  const deadlineStatus = getDeadlineStatus();

  // 優先度に応じた通常時のスタイル
  const priorityStyles: Record<number, { border: string; badge: string }> = {
    1: { border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-600' },
    2: { border: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700' },
    3: { border: 'border-l-rose-500', badge: 'bg-rose-50 text-rose-700' },
  };

  const currentPriority = priorityStyles[todo.priority] || priorityStyles[1];

  // 状態に応じたカード左ボーダー色と重要度アイコン（★ / 👹 / 💀）を決定
  const getPriorityDisplay = () => {
    if (deadlineStatus === 'overdue') {
      return {
        border: 'border-l-purple-700',
        badge: 'bg-purple-100 text-purple-800 border border-purple-300',
        icons: '💀'.repeat(todo.priority),
      };
    }
    if (deadlineStatus === 'urgent') {
      return {
        border: 'border-l-red-600',
        badge: 'bg-red-100 text-red-700 border border-red-300 animate-pulse',
        icons: '👹'.repeat(todo.priority),
      };
    }
    return {
      border: currentPriority.border,
      badge: currentPriority.badge,
      icons: '★'.repeat(todo.priority),
    };
  };

  const priorityDisplay = getPriorityDisplay();

  const formatDeadline = (date: Date | null) => {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}`;
  };

  // --- 編集モード時の表示 ---
  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-indigo-400 bg-white p-4 shadow-md space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            タスク名
          </label>
          <input
            type="text"
            value={editName}
            onChange={(e) => {
              setEditName(e.target.value);
              if (editError) setEditError('');
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {editError && (
            <p className="mt-1 text-xs font-medium text-rose-500">{editError}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              優先度
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEditPriority(value)}
                  className={`rounded-lg border py-1.5 text-xs font-bold transition ${
                    editPriority === value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {'★'.repeat(value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              期限
            </label>
            <input
              type="datetime-local"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSaveEdit}
            className="rounded-lg px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition"
          >
            保存する
          </button>
        </div>
      </div>
    );
  }

  // --- 通常表示 ---
  return (
    <div
      className={`group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 border-l-4 ${
        priorityDisplay.border
      } p-4 transition-all duration-200 ${
        todo.isDone
          ? 'bg-slate-50/80 opacity-75'
          : deadlineStatus === 'overdue'
          ? 'bg-purple-50/40 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : deadlineStatus === 'urgent'
          ? 'bg-red-50/40 shadow-sm hover:shadow-md hover:-translate-y-0.5'
          : 'bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* 左側：チェックボックスとタスク情報 */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={todo.isDone}
          onChange={(e) => updateIsDone(todo.id, e.target.checked)}
          className="mt-1 sm:mt-0 h-5 w-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition"
        />

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
          <span
            className={`font-semibold text-base truncate transition-colors ${
              todo.isDone ? 'line-through text-slate-400' : 'text-slate-800'
            }`}
          >
            {todo.name}
          </span>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 優先度バッジ（★ / 👹 / 💀） */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${priorityDisplay.badge}`}
            >
              {priorityDisplay.icons}
            </span>

            {/* 期限表示 */}
            {todo.deadline && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                  deadlineStatus === 'overdue'
                    ? 'bg-purple-100 text-purple-800'
                    : deadlineStatus === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span>
                  {deadlineStatus === 'overdue'
                    ? '⚠️ 期限切れ:'
                    : deadlineStatus === 'urgent'
                    ? '🔥 1週間以内:'
                    : '🕒'}
                </span>
                {formatDeadline(todo.deadline)}
              </span>
            )}

            {/* 完了済みバッジ */}
            {todo.isDone && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                完了済み
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 右側：編集・削除ボタン */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleStartEdit}
          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-colors duration-150"
        >
          編集
        </button>
        <button
          type="button"
          onClick={() => remove(todo.id)}
          className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-500 hover:text-white transition-colors duration-150"
        >
          削除
        </button>
      </div>
    </div>
  );
};

export default TodoItem;