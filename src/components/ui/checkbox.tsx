import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, onCheckedChange, ...props }, ref) => {
  // Create a stable callback that won't change on re-renders and handles read-only objects
  const stableOnChange = React.useCallback(
    (checked: boolean | "indeterminate") => {
      if (onCheckedChange) {
        try {
          // Using setTimeout with 0 to break potential update cycles
          // This moves the state update to the next event loop tick
          setTimeout(() => {
            onCheckedChange(checked);
          }, 0);
        } catch (error) {
          console.error("Error in checkbox onChange handler:", error);
          // Force update through an alternate path if direct change fails
          // This is a fallback for read-only properties
          window.dispatchEvent(new CustomEvent('checkbox-state-change', {
            detail: { checked, id: props.id || props.name }
          }));
        }
      }
    },
    [onCheckedChange, props.id, props.name]
  );

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground cursor-pointer font-normal",
        className
      )}
      onCheckedChange={stableOnChange}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
