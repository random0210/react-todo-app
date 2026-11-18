import React from 'react';
import type { Todo } from './types';
import TodoItem from './TodoItem';

type Props = {
  todos: Todo[];
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
  updateTodo: (
    id: string,
    name: string,
    priority: number,
    deadline: Date | null
  ) => void;
  isFiltered: boolean;
};

const TodoList: React.FC<Props> = ({
  todos,
  updateIsDone,
  remove,
  updateTodo,
  isFiltered,
}) => {
  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/60 p-10 text-center">
        <p className="text-slate-500 font-medium">
          {isFiltered
            ? '条件に一致するタスクはありません'
            : '現在登録されているタスクはありません'}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {isFiltered
            ? 'フィルターの条件を変更してみてください'
            : '下のフォームから新しいタスクを追加しましょう！'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          updateIsDone={updateIsDone}
          remove={remove}
          updateTodo={updateTodo}
        />
      ))}
    </div>
  );
};

export default TodoList;