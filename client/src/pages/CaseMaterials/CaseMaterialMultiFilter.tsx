import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@client/src/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';

interface CaseMaterialMultiFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CaseMaterialMultiFilter: React.FC<CaseMaterialMultiFilterProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const summary = selected.length === 0
    ? `全部${label}`
    : selected.length <= 2
      ? selected.join('、')
      : `${selected.slice(0, 2).join('、')} 等`;

  const toggleOption = (option: string): void => {
    onChange(
      selected.includes(option)
        ? selected.filter((item: string) => item !== option)
        : [...selected, option],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-10 w-full items-center justify-between border-2 border-ink bg-white px-3 text-left font-hand text-sm ${
            selected.length ? 'bg-postit-yellow/45 font-bold' : ''
          }`}
          aria-label={label}
        >
          <span className="line-clamp-1">{summary}</span>
          <span className="ml-2 flex shrink-0 items-center gap-1 text-xs text-ink/55">
            {selected.length ? `${selected.length}项` : ''}
            <ChevronDown className="size-4" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-none border-2 border-ink p-2 shadow-hard-sm">
        <button
          type="button"
          onClick={() => onChange([])}
          className="w-full border-b-2 border-dashed border-ink/15 px-2 py-2 text-left font-hand text-sm hover:bg-accent"
        >
          全部{label}
        </button>
        <div className="max-h-64 overflow-y-auto py-1">
          {options.map((option: string) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 px-2 py-2 font-hand text-sm hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CaseMaterialMultiFilter;
