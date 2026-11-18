import { useState, useEffect } from 'react';
import type { Todo } from './types';
import { initTodos } from './initTodos';
import WelcomeMessage from './WelcomeMessage';
import TodoList from './TodoList';
import { v4 as uuid } from 'uuid';
import dayjs from 'dayjs';

type FilterType = 'all' | 'active' | 'completed' | 'urgent';
type SortType = 'default' | 'deadline' | 'priority';

const STORAGE_KEY_TODOS = 'react-todo-app-todos-v1';
const STORAGE_KEY_NAME = 'react-todo-app-username-v1';

const App = () => {
  // localStorage からユーザー名を読み込み
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_NAME) || '';
  });
  const [nameInput, setNameInput] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');

  // localStorage からタスク一覧を読み込み（Date型も復元）
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TODOS);
    if (!saved) return initTodos;
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((item: Todo) => ({
        ...item,
        deadline: item.deadline ? new Date(item.deadline) : null,
      }));
    } catch {
      return initTodos;
    }
  });

  // フィルター・ソートの状態
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('default');

  // 新規タスク入力フォームの状態
  const [newTodoName, setNewTodoName] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | null>(null);
  const [newTodoNameError, setNewTodoNameError] = useState('');

  // userName が変わるたびに localStorage へ保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NAME, userName);
  }, [userName]);

  // todos が変わるたびに localStorage へ保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TODOS, JSON.stringify(todos));
  }, [todos]);

  const uncompletedCount = todos.filter((todo: Todo) => !todo.isDone).length;

  // 期限が1週間以内の未完了タスク数（期限切れは除外）をカウント
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const nowMs = new Date().getTime();

  const nearDeadlineCount = todos.filter((todo) => {
    if (todo.isDone || !todo.deadline) return false;
    const diff = new Date(todo.deadline).getTime() - nowMs;
    return diff > 0 && diff <= oneWeekMs;
  }).length;

  // 名前確定時の処理
  const handleStartApp = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed.length === 0 || trimmed.length > 20) {
      setNameError('1文字以上、20文字以内で入力してください');
      return;
    }
    setUserName(trimmed);
    setNameError('');
  };

  // 名前変更ボタンを押したときの処理
  const handleEditName = () => {
    setNameInput(userName);
    setUserName('');
  };

  const isValidTodoName = (name: string): string => {
    if (name.length < 2 || name.length > 32) {
      return '2文字以上、32文字以内で入力してください';
    } else {
      return '';
    }
  };

  const updateNewTodoName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoNameError(isValidTodoName(e.target.value));
    setNewTodoName(e.target.value);
  };

  const updateNewTodoPriority = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoPriority(Number(e.target.value));
  };

  const updateNewTodoDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dt = e.target.value;
    setNewTodoDeadline(dt === '' ? null : new Date(dt));
  };

  const addNewTodo = () => {
    const err = isValidTodoName(newTodoName);
    if (err !== '') {
      setNewTodoNameError(err);
      return;
    }
    const newTodo: Todo = {
      id: uuid(),
      name: newTodoName,
      isDone: false,
      priority: newTodoPriority,
      deadline: newTodoDeadline,
    };
    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    setNewTodoName('');
    setNewTodoPriority(3);
    setNewTodoDeadline(null);
  };

  const updateIsDone = (id: string, value: boolean) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, isDone: value } : todo
    );
    setTodos(updatedTodos);
  };

  // タスク内容の途中編集用
  const updateTodo = (
    id: string,
    name: string,
    priority: number,
    deadline: Date | null
  ) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, name, priority, deadline } : todo
    );
    setTodos(updatedTodos);
  };

  const remove = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
  };

  const removeCompletedTodos = () => {
    const updatedTodos = todos.filter((todo) => !todo.isDone);
    setTodos(updatedTodos);
  };

  // --- 絞り込み（フィルター）＆ 並び替え（ソート）処理 ---
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.isDone;
    if (filter === 'completed') return todo.isDone;
    if (filter === 'urgent') {
      if (todo.isDone || !todo.deadline) return false;
      const diff = new Date(todo.deadline).getTime() - nowMs;
      return diff <= oneWeekMs; // 1週間以内 または 期限切れ
    }
    return true;
  });

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === 'priority') {
      return b.priority - a.priority;
    }
    if (sortBy === 'deadline') {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return 0;
  });

  // 名前が未入力のときは「名前入力画面」を表示する
  if (!userName) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70 border border-slate-100">
          <h2 className="text-center text-xl font-extrabold text-slate-800 leading-relaxed mb-2">
            Todoアプリへようこそ！
            <br />
            名前を入力してください
          </h2>
          <p className="text-center text-sm text-slate-500 mb-6">
            入力した名前は自動保存されます
          </p>

          <form onSubmit={handleStartApp} className="space-y-4">
            <div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="例：高専 太郎"
                autoFocus
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
              />
              {nameError && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                  {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={nameInput.trim().length === 0}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-150"
            >
              アプリをはじめる
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 名前が入力された後のメインTodo画面
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* アプリタイトル */}
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            TodoApp
          </h1>
        </header>

        {/* ウェルカムメッセージ */}
        <WelcomeMessage
          name={userName}
          uncompletedCount={uncompletedCount}
          onEditName={handleEditName}
        />

        {/* 期限アラートバナー */}
        {nearDeadlineCount > 0 ? (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-sm">
            <span className="text-base">⚠️</span>
            <span>危険！期限が近いタスクが{nearDeadlineCount}個あります！</span>
          </div>
        ) : (
          <div className="mb-5 flex items-center rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-700">
            <span>現在、期限が近い課題はありません</span>
          </div>
        )}

        {/* 絞り込み（フィルター）＆ 並び替え（ソート）バー */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-white/80 backdrop-blur-sm p-3 border border-slate-200/80 shadow-sm">
          {/* フィルタータブ */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'すべて' },
              { id: 'active', label: '未完了' },
              { id: 'completed', label: '完了済み' },
              { id: 'urgent', label: '👹 急ぎ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as FilterType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ソート切り替え */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">並び替え:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortType)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="default">追加順</option>
              <option value="deadline">期限が近い順</option>
              <option value="priority">優先度が高い順</option>
            </select>
          </div>
        </div>

        {/* タスク一覧 */}
        <TodoList
          todos={sortedTodos}
          updateIsDone={updateIsDone}
          remove={remove}
          updateTodo={updateTodo}
          isFiltered={filter !== 'all'}
        />

        {/* 完了済み一括削除ボタン（ゴミ箱アイコン削除済み） */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={removeCompletedTodos}
            className="inline-flex items-center rounded-xl bg-white border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 shadow-sm hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-150"
          >
            完了済みのタスクを削除
          </button>
        </div>

        {/* 新しいタスクの追加フォーム */}
        <div className="mt-8 rounded-2xl bg-white p-6 sm:p-7 shadow-xl shadow-slate-200/60 border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
            新しいタスクの追加
          </h2>

          <div className="space-y-5">
            {/* 名前入力 */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                タスク名
              </label>
              <input
                type="text"
                value={newTodoName}
                onChange={updateNewTodoName}
                placeholder="2文字以上、32文字以内で入力してください"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
              />
              {newTodoNameError && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                  {newTodoNameError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* 優先度選択（ボタンスタイル） */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  優先度
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((value) => (
                    <label
                      key={value}
                      className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-sm font-bold cursor-pointer transition-all ${
                        newTodoPriority === value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priorityGroup"
                        value={value}
                        checked={newTodoPriority === value}
                        onChange={updateNewTodoPriority}
                        className="sr-only"
                      />
                      <span>{'★'.repeat(value)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 期限入力 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  期限
                </label>
                <input
                  type="datetime-local"
                  value={
                    newTodoDeadline
                      ? dayjs(newTodoDeadline).format('YYYY-MM-DDTHH:mm')
                      : ''
                  }
                  onChange={updateNewTodoDeadline}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                />
              </div>
            </div>

            {/* 追加ボタン */}
            <button
              type="button"
              onClick={addNewTodo}
              disabled={Boolean(newTodoNameError) || newTodoName === ''}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-150"
            >
              タスクを追加する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;