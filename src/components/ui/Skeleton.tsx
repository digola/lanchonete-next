import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function Skeleton({ className, children, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Skeleton específicos para diferentes componentes
export function ProductSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-full mb-4" />
          <div className="flex space-x-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="text-right ml-6 space-y-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="text-right">
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex space-x-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="text-center">
        <Skeleton className="h-8 w-8 mx-auto mb-2" />
        <Skeleton className="h-6 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-12 mx-auto mb-2" />
        <Skeleton className="h-4 w-20 mx-auto mb-4" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="ml-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
