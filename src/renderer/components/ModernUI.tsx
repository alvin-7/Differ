// 现代化的 UI 组件 - 不依赖 Ant Design
import * as React from 'react';
import './ModernApp.less';

// 简单的按钮组件
export const Button: React.FC<{
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: React.ReactNode;
}> = ({ onClick, children, variant = 'secondary', disabled, icon }) => {
  return (
    <button
      className={`modern-button modern-button-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      {children}
    </button>
  );
};

// 简单的 Select 组件
export const Select: React.FC<{
  value: number | string;
  onChange: (value: number) => void;
  options: Array<{ value: number | string; label: string }>;
  style?: React.CSSProperties;
}> = ({ value, onChange, options, style }) => {
  return (
    <select
      className="modern-select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={style}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

// 简单的 Input 组件
export const Input: React.FC<{
  type?: string;
  value: number | string;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  style?: React.CSSProperties;
  placeholder?: string;
}> = ({ type = 'number', value, onChange, min, max, style, placeholder }) => {
  return (
    <input
      className="modern-input"
      type={type}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      style={style}
      placeholder={placeholder}
    />
  );
};

// 简单的 Switch 组件 - 使用原生 checkbox
export const Switch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => {
  return (
    <label className="modern-switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label && <span className="switch-label">{label}</span>}
    </label>
  );
};

// Tab 组件
export const Tabs: React.FC<{
  tabs: Array<{ key: string; label: string }>;
  activeKey: string;
  onChange: (key: string) => void;
}> = ({ tabs, activeKey, onChange }) => {
  return (
    <div className="modern-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`modern-tab ${activeKey === tab.key ? 'active' : ''}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
