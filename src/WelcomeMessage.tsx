import React from 'react';

type Props = {
  name: string;
  uncompletedCount: number;
  onEditName: () => void;
};

const WelcomeMessage: React.FC<Props> = ({
  name,
  uncompletedCount,
  onEditName,
}) => {
  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-indigo-100 text-sm font-medium">Welcome back,</p>
            <button
              type="button"
              onClick={onEditName}
              className="text-xs bg-white/15 hover:bg-white/25 text-indigo-100 px-2 py-0.5 rounded-md transition cursor-pointer"
            >
              名前を変更
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            こんにちは、{name}さん
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/20">
          <span className="text-sm text-indigo-100">未完了タスク</span>
          <span className="text-2xl font-extrabold text-white">
            {uncompletedCount}
            <span className="text-xs font-normal ml-1">個</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage;