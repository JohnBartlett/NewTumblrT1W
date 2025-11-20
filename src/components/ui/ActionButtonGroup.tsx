import { motion } from 'framer-motion';

interface ActionButtonGroupProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function ActionButtonGroup({ title, children, icon, className = '', compact = false }: ActionButtonGroupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border border-gray-200 bg-gradient-to-b from-gray-50 to-white shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 ${
        compact ? 'p-2' : 'p-4'
      } ${className}`}
    >
      <div className={compact ? 'mb-1.5 flex items-center gap-1.5' : 'mb-3 flex items-center gap-2'}>
        {icon && (
          <div className="text-gray-600 dark:text-gray-400">
            {icon}
          </div>
        )}
        <h3 className={`font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 ${
          compact ? 'text-[10px]' : 'text-sm'
        }`}>
          {title}
        </h3>
      </div>
      <div className={`flex flex-wrap ${compact ? 'gap-1' : 'gap-2'}`}>
        {children}
      </div>
    </motion.div>
  );
}

