export interface ImageFiltersState {
  sizes: Set<string>; // 'small', 'medium', 'large'
  dates: Set<string>; // 'today', 'this-week', 'this-month'
  sort: 'recent' | 'popular' | 'oldest';
}

interface ImageFiltersProps {
  filters: ImageFiltersState;
  onToggleSize: (size: string) => void;
  onToggleDate: (date: string) => void;
  onSetSort: (sort: 'recent' | 'popular' | 'oldest') => void;
  onClearAll: () => void;
}

const ToggleButton = ({ 
  label, 
  active, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-500 text-white dark:bg-primary-600'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {active && (
      <svg className="mr-1 inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    )}
    {label}
  </button>
);

export function ImageFilters({ 
  filters, 
  onToggleSize, 
  onToggleDate, 
  onSetSort,
  onClearAll
}: ImageFiltersProps) {
  const activeCount = filters.sizes.size + filters.dates.size + (filters.sort !== 'recent' ? 1 : 0);

  return (
    <div className="w-full">
      {/* Header with active count */}
      <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
        <svg className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm">Filters</h3>
        {activeCount > 0 && (
          <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-medium text-white sm:px-2 sm:text-xs">
            {activeCount}
          </span>
        )}
        
        {/* Keyboard hint */}
        <div className="ml-auto hidden text-xs text-gray-400 dark:text-gray-500 lg:flex items-center gap-1">
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700">Shift</kbd>
          <span>+</span>
          <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-gray-700">Click</kbd>
          <span className="ml-1">for range</span>
        </div>
        
        {activeCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Horizontal filter groups */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* Image resolution filters */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Resolution:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <ToggleButton
              label="Small"
              active={filters.sizes.has('small')}
              onClick={() => onToggleSize('small')}
            />
            <ToggleButton
              label="Medium"
              active={filters.sizes.has('medium')}
              onClick={() => onToggleSize('medium')}
            />
            <ToggleButton
              label="Large"
              active={filters.sizes.has('large')}
              onClick={() => onToggleSize('large')}
            />
          </div>
        </div>

        {/* Date filters */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Date:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <ToggleButton
              label="Today"
              active={filters.dates.has('today')}
              onClick={() => onToggleDate('today')}
            />
            <ToggleButton
              label="This Week"
              active={filters.dates.has('this-week')}
              onClick={() => onToggleDate('this-week')}
            />
            <ToggleButton
              label="This Month"
              active={filters.dates.has('this-month')}
              onClick={() => onToggleDate('this-month')}
            />
          </div>
        </div>

        {/* Sort order */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Sort:
          </label>
          <div className="flex flex-wrap gap-1.5">
            <ToggleButton
              label="Recent"
              active={filters.sort === 'recent'}
              onClick={() => onSetSort('recent')}
            />
            <ToggleButton
              label="Popular"
              active={filters.sort === 'popular'}
              onClick={() => onSetSort('popular')}
            />
            <ToggleButton
              label="Oldest"
              active={filters.sort === 'oldest'}
              onClick={() => onSetSort('oldest')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

